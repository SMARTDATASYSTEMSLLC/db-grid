(function () {
    'use strict';

    function dbTransclude (){
        return {
            restrict: 'EA',
            link: function($scope, $element, $attrs, controller, $transclude) {
                $transclude(function(clone, scope) {
                    $element.empty();
                    scope.$grid = $scope.$grid;
                    $element.append(clone);
                });
            }
        };
    }

    angular.module('db-grid').directive('dbTransclude', dbTransclude);
})();
