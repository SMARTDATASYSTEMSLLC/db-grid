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
                angular.forEach(arg, function (col) {
                    if (col.type === 'date' && col.filter) {
                        var d = col.filter.split("-");
                        var d1 = new Date(d[0]);
                        var d2 = new Date(d[1] || (d1.valueOf()+86400000));
                        if (!isNaN(d1) && !isNaN(d2)) {
                            filters.push({
                                filter: [d1.valueOf(), d2.valueOf()],
                                key: col.key,
                                type: col.type
                            });
                        }
                    } else if ((col.type === 'number' || col.type === 'int') && col.filter) {
                        var n = col.filter.split("-");
                        if (!n[0] && n[1]) {

                            n.shift();
                            n[0] *= -1;

                        }
                        if (!n[1] && n[2]) {

                            n.splice(1, 1);
                            n[1] *= -1;

                        }
                        if (n[1] === ""){
                            n[1] =  Number.MAX_VALUE;
                        }
                        var n1 = parseFloat(n[0]);
                        var n2 = parseFloat(n[1] || n[0]);
                        filters.push({
                            filter: [n1, n2],
                            key: col.key,
                            type: 'number'
                        });
                    }else if ((col.type === 'boolean' || col.type === 'bool') && col.filter){

                        if (/^(0|(false)|(no)|n|f)$/i.test(col.filter) || /^([1-9]\d*|(true)|(yes)|y|t)$/i.test(col.filter)) {
                        filters.push({
                                filter: /^([1-9]\d*|(true)|(yes)|y|t)$/i.test(col.filter),
                            key: col.key,
                            type: 'bool'
                        });
                        }else if (col.trueFilter && col.falseFilter && col.filter.toLowerCase() === col.trueFilter || col.filter.toLowerCase() === col.falseFilter.toLowerCase()){
                            filters.push({
                                filter: col.filter.toLowerCase() === col.trueFilter.toLowerCase(),
                                key: col.key,
                                type: 'bool'
                            });
                        }

                    }else if (col.filter && typeof col.filter === 'string'){
                        filters.push({
                            filter:col.filter.toLowerCase(),
                            key: col.key
                        });
                    }
                });

                // run query
                return $filter('filter')(input, function (item) {

                    var index = -1,
                        length = filters.length;

                    while (++index < length) {
                        var col = filters[index];
                        if (!col.key) {
                            continue;
                        } else if (
                               (!col.type && angular.isObject(prop(item, col.key)) && col.filter.length >= 2 && JSON.stringify(prop(item, col.key)).toLowerCase().indexOf(col.filter) === -1) ||
                               (!col.type && (prop(item, col.key) + "").toLowerCase().indexOf(col.filter) === -1) ||
                               (col.type === 'bool'   && Boolean(prop(item, col.key)) !== col.filter) ||
                               (col.type === 'number' && (prop(item, col.key) < col.filter[0] || prop(item, col.key) > col.filter[1]))
                        ){
                            return false;
                        } else if (col.type === 'date') {
                            var d = (new Date(prop(item,col.key))).valueOf();
                            if (d < col.filter[0] || d > col.filter[1]) {
                                return false;
                            }
                        }

                    }
                    return true;
                });
            }


        };
    }

    angular.module('db-grid').filter('complexFilter', complexFilter);
})();
