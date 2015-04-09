
(function () {
    'use strict';

    // For internal use. Manually binds a template using a provided template function, with a fallback to $compile.
    // Needs to be lightweight.

    function dbBindCell ($compile) {
        return{
            restrict: 'A',
            link: function ($scope, $element) {
                if (typeof $scope._col.template === 'function'){
                    $element.append($scope._col.template($scope));

                }else if(!$element.html().trim()){
                    // template must be wrapped in a single tag
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
        };
    }


    angular.module('db-grid').directive('dbBindCell', dbBindCell);
})();
