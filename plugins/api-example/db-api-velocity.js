
(function () {
    'use strict';

    /*
        An example server side api handler. Requires Moment
     */

    function dbApiVelocity ($http, $rootScope, moment) {
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
                            if (item.key && item.colsortable && item.type === 'number'){
                                if (isNumeric(filter)) {
                                    r.push({
                                        fieldType: 'decimal',
                                        fieldOperator: 'eq',
                                        fieldValue: parseFloat(filter),
                                        field: capitalize(item.key)
                                    });
                                }
                            }else if (item.key && item.colsortable && item.type === 'date'){
                                if (dateRegex.test(filter) && moment(filter).isValid()) {
                                    r.push({
                                        fieldType: 'date',
                                        fieldOperator: 'eq',
                                        fieldValue: filter,
                                        field: capitalize(item.key)
                                    });
                                }
                            }else if (item.key && item.colsortable){
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

    angular.module('db-grid').directive('dbApiVelocity', dbApiVelocity);
})();
