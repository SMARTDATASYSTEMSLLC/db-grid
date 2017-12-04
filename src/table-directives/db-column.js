
(function () {
    'use strict';

    /**
     * A column definition for use in the db-grid
     *
     * <db-grid for="item in items">
     *     <db-col key="name">{{item.name}} is my name.</db-col>
     * </db-grid>
     *
     * @param {string} key      - The key to base sorting and filtering on.
     * @param {string} label    - A custom label. Defaults to key name.
     * @param {string} type     - 'string', 'number', or 'date'. Used for filtering and sorting. Defaults to 'string'.
     * @param {bool}   canSort - Whether or not the column is sortable. Defaults to true.
     * @param {bool}   bind     - Whether to use full binding on the column. True will use full binding, false will use
     *                            once-bound interpolate templates. Defaults to false.
     */
    function dbCol ($interpolate) {
        return{
            restrict: 'E',
            require: '^dbGrid',
            compile:function(tElement){
                var templateText = tElement.html().trim();
                tElement.empty();

                return function ($scope, $element, $attrs, dbGrid) {
                    var templateFunc = null;

                    if (!templateText && $attrs.key){
                        templateText = '{{' + dbGrid.rowName + '.' + $attrs.key + '}}';
                    }
                    if ($attrs.bind === 'true'){
                        templateFunc = templateText;
                    }else{
                        templateFunc = $interpolate(templateText);
                    }

                    var column = {
                        index: $element.prevAll('db-col').length,
                        filter: $attrs.query,
                        width: $attrs.width,
                        colClass: $attrs.colClass,
                        falseFilter: $attrs.falseFilter || '',
                        trueFilter: $attrs.trueFilter || '',
                        key: $attrs.key,
                        label: $attrs.label,
                        canSort:  $attrs.canSort === 'false' ? false : !!$attrs.key,
                        type: $attrs.type,
                        title: $attrs.title,
                        bind: $attrs.bind === 'true',
                        template: templateFunc
                    };

                    dbGrid.addColumn(column);

                    if($attrs.query !== undefined){
                        $attrs.$observe('query', function (val, old){
                           if(val !== old){
                               if (val) {
                                   dbGrid.setAdvanced(true);
                               }
                               column.filter = val;
                               dbGrid.refresh();
                           }
                        });
                    }

                    $scope.$on('$destroy', function() {
                        dbGrid.removeColumn(column);
                    });
                };
            }
        };
    }

    angular.module('db-grid').directive('dbCol', dbCol);
})();
