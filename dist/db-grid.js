/*! 
 * db-grid
 * Lightweight angular grid
 * @version 1.0.1 
 * 
 * Copyright (c) 2015 Steve Gentile, David Benson 
 * @link https://github.com/SMARTDATASYSTEMSLLC/sds-angular-controls 
 * @license  MIT 
 */ 
angular.module('db-grid', []);

(function (){
  'use strict';

  function camelCase (){
    return function (input) {
      return input.toLowerCase().replace(/ (\w)/g, function (match, letter) {
        return letter.toUpperCase();
      });
    };
  }

  angular.module('sds-angular-controls').filter('camelCase', camelCase);
})();

(function (){
    'use strict';

    function complexFilter ($filter){
        return function(input,arg) {
            if (typeof arg === "string"){
                return $filter('filter')(input, arg);

            }else {
                var prop = function (obj, key){
                    var arr = key.split(".");
                    while(arr.length && (obj = obj[arr.shift()])); // jshint ignore:line
                    return obj;
                };


                var filters = [];
                // setup filters
                _.each(arg, function (col) {
                    if (col.type === 'date' && col.filter) {
                        var d = col.filter.split("-");
                        var d1 = moment(d[0]);
                        var d2 = moment(d[1] || d1.clone().endOf('day'));
                        if (d1.isValid() && d2.isValid()) {
                            filters.push({
                                filter: [d1.valueOf(), d2.valueOf()],
                                key: col.key,
                                type: col.type
                            });
                        }
                    } else if (col.type === 'number' && col.filter) {
                        var n = col.filter.split("-");
                        if (!n[0] && n[1]) {
                            console.log(n);
                            n.shift();
                            n[0] *= -1;
                            console.log(n);
                        }
                        if (!n[1] && n[2]) {
                            console.log(n);
                            n.splice(1, 1);
                            n[1] *= -1;
                            console.log(n);
                        }
                        if (n[1] === ""){
                            n[1] =  Number.MAX_VALUE;
                        }
                        var n1 = parseFloat(n[0]);
                        var n2 = parseFloat(n[1] || n[0]);
                        filters.push({
                            filter: [n1, n2],
                            key: col.key,
                            type: col.type
                        });
                    }else if (col.type === 'bool' && col.filter){
                        var b = col.filter.toLowerCase();
                        if (b === 'no'.substr(0, b.length) || b === 'false'.substr(0, b.length)){
                            b = false;
                        }
                        filters.push({
                            filter: !!b,
                            key: col.key,
                            type: col.type
                        });
                    }else if (col.filter && typeof col.filter === 'string'){
                        filters.push({
                            filter:col.filter.toLowerCase(),
                            key: col.key
                        });
                    }
                });

                // run query
                return _.filter(input, function (item) {
                    return _.all(filters, function (col) {
                        if (!col.key) {
                            return true;
                        } else if (!col.type && _.isObject(prop(item,col.key))) {
                            return _.any(prop(item,col.key), function (v){
                                if (_.isPlainObject(v)){
                                    return _.any(v, function (vv){
                                        return (vv + "").toLowerCase().indexOf(col.filter) > -1;
                                    });
                                }else{
                                    return (prop(item,col.key) + "").toLowerCase().indexOf(col.filter) > -1;
                                }
                            });
                        } else if (!col.type) {
                            return (prop(item,col.key) + "").toLowerCase().indexOf(col.filter) > -1;
                        } else if (col.type === 'date') {
                            var d = moment(prop(item,col.key)).valueOf();
                            return d >= col.filter[0] && d <= col.filter[1];
                        } else if (col.type === 'number') {
                            return prop(item,col.key) >= col.filter[0] && prop(item,col.key) <= col.filter[1];
                        }else if (col.type === 'bool') {
                            return !!prop(item,col.key) === col.filter;
                        }
                    });
                });
            }


        };
    }
    complexFilter.$inject = ["$filter"];

    angular.module('sds-angular-controls').filter('complexFilter', complexFilter);
})();

(function (){
  'use strict';

  function labelCase (){
    return function (input) {

      if (input === null || input === undefined || input === ''){
          input = ' ';
      }
      input = (input + '').replace(/([A-Z])/g, ' $1');
      return input[0].toUpperCase() + input.slice(1);
    };
  }

  angular.module('sds-angular-controls').filter('labelCase', labelCase);
})();

(function (){
    'use strict';

    function page (){
        return function(input, page, size) {
            if (!input || !input.length){
                return [];
            }

            page = parseInt(page || 0, 10) || 0;
            size = parseInt(size || 0, 10);
            if (!size){
                size = 25;
            }
            return input.slice(page * size, (page+1) * size);
        };
    }

    angular.module('sds-angular-controls').filter('page', page);
})();


(function () {
    'use strict';

    /*
        An example server side api handler
     */

    function dbApiVelocity ($http, $rootScope) {
        return{
            restrict: 'E',
            require: '^dbGrid',
            scope:{
                api: '@',
                postParams: '='
            },
            link: function (scope, element, attr, dbGrid) {

                if (attr.postParams){
                    scope.$watch('postParams', function (val){
                        if(val) {
                            dbGrid.refresh(true);
                        }
                    });
                }

                function capitalize (str){
                    return str.charAt(0).toUpperCase() + str.slice(1);
                }

                function isNumeric (obj){
                   return (obj - parseFloat( obj ) + 1) >= 0;
                }

                function getData(filter, sortKey, sortAsc, currentPage, pageSize, cols){
                    var query = {
                        page: currentPage+1,
                        pageSize: pageSize,
                        sort: [],
                        filter: createFilters(filter, cols)
                    };
                    if (sortKey !== null){
                        query.sort.push({
                            field: capitalize(sortKey),
                            direction: sortAsc ? '' : 'desc'
                        });
                    }
                    _.merge(query, scope.postParams, function(a, b) {
                        if (_.isArray(a)) {
                            return a.concat(b);
                        }
                    });

                    $rootScope.$broadcast('db-api:start', query);
                    dbGrid.setWaiting(true);
                    return $http.post(scope.api, query).then(function (response) {
                        $rootScope.$broadcast('db-api:complete', response.data);
                        dbGrid.setTotal(response.data.total);
                        dbGrid.setWaiting(false);
                        return response.data.tableData;
                    }, function (){
                        dbGrid.setWaiting(false);
                        $rootScope.$broadcast('db-api:complete');
                    });
                }

                function createFilters (filter, cols){
                    var result = {filters: []};
                    var dateRangeRegex = /^(\s*(\d+[-/]){2}[^-]*)-(\s*(\d+[-/]){2}[^-]*)$/;
                    var dateRegex = /^(\s*(\d+[-/]){2}[^-]*)$/;

                    if (typeof filter === 'object'){
                        var n;
                        result.logic = 'and';
                        result.filters = _.reduce(cols, function (r, item){
                            if (item.key && item.filter && item.type === 'number' && item.filter[0] === '-'){
                                n = item.filter.slice(1);
                                if (isNumeric(n)) {
                                    r.push({
                                        fieldType: 'decimal',
                                        fieldOperator: 'lt',
                                        fieldValue: parseFloat(n),
                                        field: capitalize(item.key)
                                    });
                                }

                            }else if (item.key && item.filter && item.type === 'date' && item.filter[0] === '-'){
                                n = item.filter.slice(1);
                                if (dateRegex.test(n) && moment(n).isValid()) {
                                    r.push({
                                        fieldType: 'datetime',
                                        fieldOperator: 'lt',
                                        fieldValue: moment(n).utcOffset(0).format('MM/DD/YYYY HH:mm a'),
                                        field: capitalize(item.key)
                                    });
                                }
                            }else if (item.key && item.filter && item.type === 'number' && item.filter.indexOf('-') > 0){
                                n = item.filter.split('-');
                                if(!n[0] && n[1]){
                                    n.slice(0,1);
                                    n[0] *= -1;
                                }
                                if(!n[1] && n[2]){
                                    n.slice(1,1);
                                    n[1] *= -1;
                                }
                                if (isNumeric(n[0]) && isNumeric(n[1])) {
                                    r.push({
                                        fieldType: 'decimal',
                                        fieldOperator: 'gte',
                                        fieldValue: parseFloat(n[0]),
                                        field: capitalize(item.key)
                                    });
                                    r.push({
                                        fieldType: 'decimal',
                                        fieldOperator: 'lte',
                                        fieldValue: parseFloat(n[1]),
                                        field: capitalize(item.key)
                                    });
                                }

                            }else if (item.key && item.filter && item.type === 'date' && dateRangeRegex.test(item.filter)){
                                n = dateRangeRegex.exec(item.filter);

                                if (moment(n[1]).isValid() && moment(n[3]).isValid()) {
                                    r.push({
                                        fieldType: 'datetime',
                                        fieldOperator: 'gte',
                                        fieldValue: moment(n[1]).utcOffset(0).format('MM/DD/YYYY HH:mm a'),
                                        field: capitalize(item.key)
                                    });
                                    r.push({
                                        fieldType: 'datetime',
                                        fieldOperator: 'lte',
                                        fieldValue: moment(n[3]).utcOffset(0).format('MM/DD/YYYY HH:mm a'),
                                        field: capitalize(item.key)
                                    });
                                }
                            }else if (item.key && item.filter && item.type === 'number'){
                                if (isNumeric(item.filter)) {
                                    r.push({
                                        fieldType: 'decimal',
                                        fieldOperator: 'eq',
                                        fieldValue: parseFloat(item.filter),
                                        field: capitalize(item.key)
                                    });
                                }
                            }else if (item.key && item.filter && item.type === 'date'){
                                if (moment(item.filter).isValid()) {
                                    r.push({
                                        fieldType: 'datetime',
                                        fieldOperator: 'gte',
                                        fieldValue: moment(item.filter).startOf('day').utcOffset(0).format('MM/DD/YYYY HH:mm a'),
                                        field: capitalize(item.key)
                                    });
                                    r.push({
                                        fieldType: 'datetime',
                                        fieldOperator: 'lte',
                                        fieldValue: moment(item.filter).endOf('day').utcOffset(0).format('MM/DD/YYYY HH:mm a'),
                                        field: capitalize(item.key)
                                    });
                                }
                            }else if (item.key && item.filter){
                                r.push({
                                    fieldType:'string',
                                    fieldOperator:'contains',
                                    fieldValue: item.filter,
                                    field: capitalize(item.key)
                                });
                            }

                            return r;
                        }, []);
                    }else if (typeof filter === 'string' && filter){
                        result.logic = 'or';
                        result.filters = _.reduce(cols, function (r, item){
                            if (item.key && item.sortable && item.type === 'number'){
                                if (isNumeric(filter)) {
                                    r.push({
                                        fieldType: 'decimal',
                                        fieldOperator: 'eq',
                                        fieldValue: parseFloat(filter),
                                        field: capitalize(item.key)
                                    });
                                }
                            }else if (item.key && item.sortable && item.type === 'date'){
                                if (dateRegex.test(filter) && moment(filter).isValid()) {
                                    r.push({
                                        fieldType: 'date',
                                        fieldOperator: 'eq',
                                        fieldValue: filter,
                                        field: capitalize(item.key)
                                    });
                                }
                            }else if (item.key && item.sortable){
                                r.push({
                                    fieldType:'string',
                                    fieldOperator:'contains',
                                    fieldValue: filter,
                                    field: capitalize(item.key)
                                });
                            }
                            return r;
                        }, []);
                    }
                    return result;
                }

                dbGrid.setDataSource(getData);
            }

        }
    }
    dbApiVelocity.$inject = ["$http", "$rootScope"];

    angular.module('sds-angular-controls').directive('dbApiVelocity', dbApiVelocity);
})();


(function () {
    'use strict';

    // For internal use only. Manually binds a template using a provided template function, with a fallback to $compile.
    // Needs to be extremely lightweight.

    function dbBindCell ($compile) {
        return{
            restrict: 'A',
            link: function ($scope, $element) {
                if (typeof $scope._col.template === 'function'){
                    $element.append($scope._col.template($scope));

                }else if(!angular.element.trim($element.html())){
                    var html = angular.element('<span>' + $scope._col.template  + '</span>');
                    var compiled = $compile(html) ;
                    $element.append(html);
                    compiled($scope);
                    $element.data('compiled', compiled);
                }

                if ($scope._col.layoutCss){
                  $element.addClass($scope._col.layoutCss);
                }
            }
        }
    }
    dbBindCell.$inject = ["$compile"];

    function dbTransclude (){
        return {
            restrict: 'EAC',
            link: function($scope, $element, $attrs, controller, $transclude) {
                $transclude(function(clone, scope) {
                    $element.empty();
                    scope.$grid = $scope.$grid;
                    $element.append(clone);
                });
            }
        }
    }

    angular.module('sds-angular-controls').directive('dbBindCell', dbBindCell).directive('dbTransclude', dbTransclude)
})();


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
     * @param {bool}   sortable - Whether or not the column is sortable. Defaults to true.
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
                        templateText = '{{' + dbGrid.rowName + '.' + $attrs.key + '}}'
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
                        layoutCss: $attrs.layoutCss,
                        key: $attrs.key,
                        label: $attrs.label,
                        sortable:  $attrs.sortable === 'false' ? false : !!$attrs.key,
                        type: $attrs.type,
                        title: $attrs.title,
                        bind: $attrs.bind === 'true',
                        template: templateFunc
                    };

                    dbGrid.addColumn(column);

                    if($attrs.query !== undefined){
                        $attrs.$observe('query', function (val, old){
                           if(val != old){
                               column.filter = val;
                               dbGrid.refresh();
                           }
                        });
                    }

                    $scope.$on('$destroy', function() {
                        dbGrid.removeColumn(column);
                    });
                }
            }
        }
    }
    dbCol.$inject = ["$interpolate"];

    angular.module('sds-angular-controls').directive('dbCol', dbCol);
})();

(function () {
    'use strict';

    /**
     * Creates a grid with sorting, paging, filtering, and the ability to add custom data sources.
     * Can contain custom toolbar buttons, a custom data source element, and a list of db-cols.
     *
     * <db-grid for="items in item">
     *     <db-column key="name"></db-column>
     * </db-grid>
     *
     * @param {string}     format    - A label to put next to the count (TODO: make this customizable)
     * @param {string}     layoutCss - A css class to add to the table
     * @param {string}     filter    - One of the options 'none', 'simple' or 'advanced'. Defaults to 'advanced'. Bound once.
     * @param {int}        pageSize  - The page size, defaults to 25. Bound once.
     * @param {expression} for       - Required. Either 'item in items' or (when used with a custom data source) just 'item'
     */
    function dbGrid ($filter, $timeout, $q, $log) {
        return {
            restrict: 'E',
            replace: true,
            transclude:true,
            scope:true,
            templateUrl: 'sds-angular-controls/table-directives/db-grid.html',
            compile: function (tElement, tAttrs){
                var loop = tAttrs.for.split(' ');
                if (loop.length !== 1 && loop[1] != 'in') {
                    $log.error('Invalid loop');
                    return;
                }

                tElement.find('tbody > tr').attr('ng-repeat', loop[0] + ' in _model.filteredItems');
            },
            controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs){
                var complexFilter = $filter('complexFilter');
                var orderByFilter = $filter('orderBy');
                var pageFilter = $filter('page');

                $scope._model = {
                    isApi: false,
                    label: $attrs.label,
                    layoutCss: $attrs.layoutCss,
                    currentPage: 1,
                    total: 0,
                    sortAsc: $attrs.sort ? $attrs.sort[0] !== '-' : true,
                    sort: null,
                    filterText: null,
                    showAdvancedFilter: false,
                    pageSize: $attrs.pageSize ? parseInt($attrs.pageSize, 10) : 25,
                    filterType: ($attrs.filter || 'advanced').toLowerCase(),
                    cols: [],
                    items: null,
                    filteredItems: null,
                    getTooltip: getTooltip,
                    getItems: defaultGetItems,
                    toggleSort: toggleSort,
                    clearFilters: clearFilters,
                    onEnter: onEnter,
                    refresh: _.debounce(refresh, 100),
                    waiting: false
                };
                $scope.$grid = {
                    refresh: _.debounce(resetRefresh, 100),
                    items: function (){ return $scope._model.filteredItems; }
                };



                var loop = $attrs.for.split(' ');
                this.rowName = loop[0];
                if (loop[2]) {
                    $scope.$watchCollection(loop.slice(2).join(' '), function (items, old) {
                        $scope._model.currentPage = 1;
                        $scope._model.filteredItems = null;
                        $scope._model.items = items;
                        $scope._model.refresh();
                    });
                }

                function defaultGetItems (filter, sortKey, sortAsc, page, pageSize, cols){
                    if ($scope._model.items) {
                        var items = complexFilter($scope._model.items, filter);
                        if (sortKey){
                            items = orderByFilter(items, sortKey, !sortAsc);
                        }
                        $scope._model.total = items ? items.length : 0;
                        return $q.when(pageFilter(items, page, pageSize));
                    }else{
                        return $q.when(null);
                    }
                }

                function toggleSort(index){
                    if ($scope._model.sort === index)  {
                        $scope._model.sortAsc = !$scope._model.sortAsc;
                    }else{
                        $scope._model.sort = index;
                    }
                }

                function clearFilters(){
                    _.each($scope._model.cols, function (item){
                       item.filter = '';
                    });
                    $scope._model.refresh();
                }

                function onEnter(){
                    if ($scope._model.items.length === 1){
                        $timeout(function (){
                            $element.find('tbody tr a:first').click();
                        });
                    }
                }

                function getTooltip(col){
                    if (col.title){
                        return col.title;
                    }
                    if (col.type === 'bool'){
                        return 'Filter using yes, no, true, or false'
                    }else if (col.type){
                        return 'Use a dash (-) to specify a range'
                    }
                }

                function resetRefresh(){
                        $scope._model.currentPage = 1;
                        if($scope._model.isApi) {
                            $scope._model.filteredItems = null;
                        }
                    refresh();
                    }

                function refresh() {
                    //$timeout(function () {
                        $scope._model.getItems(
                            $scope._model.showAdvancedFilter ? $scope._model.cols : $scope._model.filterText,
                            $scope._model.sort !== null ? $scope._model.cols[$scope._model.sort].key : null,
                            $scope._model.sortAsc,
                            $scope._model.currentPage - 1,
                            $scope._model.pageSize,
                            $scope._model.cols
                        ).then(function (result){
                            $scope._model.filteredItems = result;
                        });
                    //});
                }

                this.addColumn = function (item){
                    var sort = $attrs.sort || '';
                    if (sort[0] === '-' || sort[0] === '+'){
                        sort = sort.slice(1);
                    }

                    if (sort && sort === item.key && $scope._model.sort === null){
                        $scope._model.sort = $scope._model.cols.length;
                    }

                    if (item.filter){
                        $scope._model.showAdvancedFilter = true;
                    }
                    $scope._model.cols.splice(item.index, 0, item);
                };

                this.removeColumn = function (item) {
                    var index = $scope._model.cols.indexOf(item);
                    if (index > -1) {
                        $scope._model.cols.splice(index, 1);
                    }
                };

                this.setDataSource = function (dataSource){
                    $timeout(function(){
                    $scope._model.getItems = dataSource;
                    $scope._model.isApi = true;
                    $scope._model.refresh.cancel();
                    $scope.$grid.refresh.cancel();
                    $scope._model.refresh = _.debounce(refresh, 1000);
                    $scope.$grid.refresh  = _.debounce(resetRefresh, 1000);
                    refresh();
                    });
                };

                this.setTotal = function (total){
                    $scope._model.total = total;
                };

                this.setWaiting = function (waiting){
                    $scope._model.waiting = waiting;
                };

                this.refresh = function (force){
                    if ($scope._model.items || force){
                        resetRefresh();
                    }
                };

                if($attrs.query !== undefined){
                    $attrs.$observe('query', function (val, old){
                        if(val != old){
                            if (_.isString(val)){
                                $scope._model.filterText = val;
                            }
                            $scope._model.refresh();
                        }
                    });
                }

                $scope.$watch('_model.currentPage', refresh);
                $scope.$watch('_model.sort',        $scope._model.refresh);
                $scope.$watch('_model.sortAsc',     $scope._model.refresh);


            }]
        };
    }
    dbGrid.$inject = ["$filter", "$timeout", "$q", "$log"];

    angular.module('sds-angular-controls').directive('dbGrid', dbGrid);
})();

(function () {

    function isolateControl() {
        return {
            restrict: 'A',
            require: ['ngModel', '^?form'],
            link: function (scope, elm, attrs, ctrls) {
                // Do a copy of the controller
                var ctrlCopy = {};
                angular.copy(ctrls[0], ctrlCopy);

                if (ctrls[1]) {
                    ctrls[1].$removeControl(ctrls[0]);
                }

                var isolated = {
                    $addControl    : angular.noop,
                    $removeControl : angular.noop,
                    $setValidity: function (validationToken, isValid, control) {
                        //ctrlCopy.$setValidity(validationToken, isValid, control);
                    },
                    $setDirty: function () {
                        elm.removeClass('ng-pristine').addClass('ng-dirty');
                        ctrls[0].$dirty = true;
                        ctrls[0].$pristine = false;
                    },
                    $setPristine: function () {
                        elm.removeClass('ng-dirty').addClass('ng-pristine');
                        ctrls[0].$dirty = false;
                        ctrls[0].$pristine = true;
                    }
                };
                angular.extend(ctrls[0], isolated);
            }
        };
    }

    angular.module('sds-angular-controls').directive('isolateControl', isolateControl);
})();
angular.module('db-grid').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('db-grid/table-directives/db-grid.html',
    "<div class=\"table-responsive\"> <div class=\"btn-toolbar\"> <a ng-if=\"_model.showAdvancedFilter\" href=\"\" class=\"btn btn-default\" ng-click=\"_model.clearFilters()\">Clear All Filters <span class=\"big-x\">&times;</span></a> <div ng-if=\"!_model.showAdvancedFilter && _model.filterType !== 'none'\" class=\"toolbar-input\"> <div class=\"form-group has-feedback\"> <input class=\"form-control\" type=\"text\" ng-model=\"_model.filterText\" ng-keyup=\"$grid.refresh()\" placeholder=\"Filter {{_model.label || 'items'}}\" on-enter=\"_model.onEnter()\" isolate-control> <a href=\"\" ng-click=\"_model.filterText = ''; $grid.refresh()\" class=\"form-control-feedback feedback-link\">&times;</a> </div> </div> <a href=\"\" ng-if=\"_model.filterType === 'advanced'\" class=\"btn btn-default\" ng-class=\"{'btn-primary': _model.showAdvancedFilter}\" ng-click=\"_model.showAdvancedFilter = !_model.showAdvancedFilter\">{{_model.showAdvancedFilter ? 'Simple' : 'Advanced'}} Filtering</a> <db-transclude></db-transclude> <p ng-if=\"_model.total && _model.label\"><i>{{_model.total}} {{_model.label}}</i></p> </div> <table class=\"table db-grid table-hover {{_model.layoutCss}}\"> <thead> <tr ng-if=\"_model.showAdvancedFilter\"> <th ng-repeat=\"_col in _model.cols\" ng-style=\"{width: _col.width}\" class=\"{{_col.layoutCss}}\"> <div ng-if=\"::_col.sortable\"> <input type=\"text\" class=\"form-control filter-input\" on-enter=\"_model.onEnter()\" ng-keyup=\"$grid.refresh()\" ng-model=\"_col.filter\" placeholder=\"Filter {{::_col.label || (_col.key | labelCase)}}\" tooltip=\"{{_model.getTooltip(_col)}}\" tooltip-trigger=\"focus\" tooltip-placement=\"top\" isolate-control> </div>   <tr> <th ng-repeat=\"_col in _model.cols\" ng-style=\"{width: _col.width}\" class=\"{{_col.layoutCss}}\"> <a href=\"\" ng-if=\"::_col.sortable\" ng-click=\"_model.toggleSort($index)\">{{::_col.label || (_col.key | labelCase) }}&nbsp;<i class=\"fa\" style=\"display: inline\" ng-class=\"{\n" +
    "                         'fa-sort'     : _model.sort !== $index,\n" +
    "                         'fa-sort-down': _model.sort === $index &&  _model.sortAsc,\n" +
    "                         'fa-sort-up'  : _model.sort === $index && !_model.sortAsc\n" +
    "                         }\"></i> </a> <span ng-if=\"::!_col.sortable\"> {{::_col.label || (_col.key | labelCase)}} </span>    <tbody ng-show=\"!_model.waiting\"> <tr> <td ng-repeat=\"_col in _model.cols\" db-bind-cell>   </table> <div ng-if=\"_model.filteredItems && _model.filteredItems.length === 0 && _model.label && !_model.waiting\" class=\"db-summary\"> No {{_model.label}}. </div> <pagination ng-if=\"_model.total > _model.pageSize && !_model.waiting\" total-items=\"_model.total\" items-per-page=\"_model.pageSize\" max-size=\"10\" rotate=\"false\" ng-model=\"_model.currentPage\" isolate-control></pagination> <div ng-show=\"_model.waiting\"> <i class=\"fa fa-circle-o-notch fa-spin\"></i> Please Wait... </div> </div>"
  );

}]);
