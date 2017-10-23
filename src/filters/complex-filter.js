(function () {
    'use strict';

    function complexFilter($filter) {

        function filterFunc(filters, col) {
            if (col.filter) {
                switch (col.type) {
                    case 'date':
                        var d = col.filter.split("-");
                        var d1 = new Date(d[0]);
                        var d2 = new Date(d[1] || (d1.valueOf() + 86400000));
                        if (!isNaN(d1) && !isNaN(d2)) {
                            filters.push({
                                filter: [d1.valueOf(), d2.valueOf()],
                                key: col.key,
                                type: col.type
                            });
                        }
                        break;
                    case 'number':
                    case 'int':
                        var n = col.filter.split("-");
                        if (!n[0] && n[1]) {
                            n.shift();
                            n[0] *= -1;

                        }
                        if (!n[1] && n[2]) {

                            n.splice(1, 1);
                            n[1] *= -1;

                        }
                        if (n[1] === "") {
                            n[1] = Number.MAX_VALUE;
                        }
                        var n1 = parseFloat(n[0]);
                        var n2 = parseFloat(n[1] || n[0]);
                        filters.push({
                            filter: [n1, n2],
                            key: col.key,
                            type: 'number'
                        });
                        break;
                    case 'boolean':
                    case 'bool':
                        if (/^(0|(false)|(no)|n|f)$/i.test(col.filter) || /^([1-9]\d*|(true)|(yes)|y|t)$/i.test(col.filter)) {
                            filters.push({
                                filter: /^([1-9]\d*|(true)|(yes)|y|t)$/i.test(col.filter),
                                key: col.key,
                                type: 'bool'
                            });
                        } else if (col.trueFilter && col.falseFilter && col.filter.toLowerCase() === col.trueFilter || col.filter.toLowerCase() === col.falseFilter.toLowerCase()) {
                            filters.push({
                                filter: col.filter.toLowerCase() === col.trueFilter.toLowerCase(),
                                key: col.key,
                                type: 'bool'
                            });
                        }
                        break;
                    default:
                        if (typeof col.filter === 'string' && col.filter.substr(0, 2) === '<>') {
                            filters.push({
                                filter: col.filter.substr(2).toLowerCase().trim(),
                                key: col.key,
                                negated: true
                            });
                        } else if (typeof col.filter === 'string') {
                            filters.push({
                                filter: col.filter.toLowerCase().trim(),
                                key: col.key
                            });
                        }

                }
            }
            return filters;
        }

        function prop (obj, key) {
            var arr = key.split(".");
            while (arr.length && (obj = obj[arr.shift()])) {} // jshint ignore:line
            return obj;
        }

        return function (input, arg) {
            if (typeof arg === "string") {
                return $filter('filter')(input, arg);

            } else {

                var filters = [];
                if (Array.isArray(arg)) {
                    filters = arg.reduce(filterFunc, []);
                }
                // run query
                return $filter('filter')(input, function (item) {

                    var index = -1,
                        length = filters.length;

                    while (++index < length) {
                        var col = filters[index];
                        if (col.key) {
                            if (
                                (!col.type &&
                                    angular.isObject(prop(item, col.key)) &&
                                    col.filter.length >= 2 &&
                                    !col.negated &&
                                    JSON.stringify(prop(item, col.key)).toLowerCase().indexOf(col.filter) === -1

                                ) ||
                                (!col.type &&
                                    angular.isObject(prop(item, col.key)) &&
                                    col.filter.length >= 2 &&
                                    col.negated &&
                                    JSON.stringify(prop(item, col.key)).toLowerCase().indexOf(col.filter) > -1

                                ) ||
                                (!col.type && !col.negated && (prop(item, col.key) + "").toLowerCase().indexOf(col.filter) === -1) ||
                                (!col.type && col.negated && (prop(item, col.key) + "").toLowerCase().indexOf(col.filter) > -1) ||
                                (col.type === 'bool' && Boolean(prop(item, col.key)) !== col.filter) ||
                                (col.type === 'number' && (prop(item, col.key) < col.filter[0] || prop(item, col.key) > col.filter[1]))
                            ) {
                                return false;
                            } else if (col.type === 'date') {
                                var d = (new Date(prop(item, col.key))).valueOf();
                                if (d < col.filter[0] || d > col.filter[1]) {
                                    return false;
                                }
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
