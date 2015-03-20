/*
    This filter will take an object of filters to reduce from:
    {
        columnName1: "value"
        ColumnName2: 11
        ColumnName3: [rangeStart, rangeEnd],
        all: "general filter"
    }
 */
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

    angular.module('sds-angular-controls').filter('complexFilter', complexFilter);
})();
