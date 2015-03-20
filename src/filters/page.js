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
