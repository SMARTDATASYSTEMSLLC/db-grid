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
     * @param {string}     tableClass - A css class to add to the table
     * @param {string}     filter    - One of the options 'none', 'simple' or 'advanced'. Defaults to 'advanced'. Bound once.
     * @param {int}        pageSize  - The page size, defaults to 25. Bound once.
     * @param {expression} for       - Required. Either 'item in items' or (when used with a custom data source) just 'item'
     */
    function dbGrid ($filter, $timeout, $q, $log) {
        return {
            restrict: 'E',
            transclude:true,
            scope:true,
            templateUrl: 'db-grid/table-directives/db-grid.html',
            compile: function (tElement, tAttrs){
                var loop = tAttrs.for.split(' ');
                if (loop.length !== 1 && loop[1] !== 'in') {
                    $log.error('Invalid loop');
                    return;
                }

                tElement.find('tbody').children().attr('ng-repeat', loop[0] + ' in _model.filteredItems');

                var click = tAttrs.rowClick;
                if (click){
                    tElement.find('tbody').children().attr('ng-click', click);
                }
            },
            controller: function ($scope, $element, $attrs){
                var complexFilter = $filter('complexFilter');
                var orderByFilter = $filter('orderBy');
                var pageFilter = $filter('page');

                var debounce = function debounce(func, wait) {
                    var timeout;
                    var deb = function() {
                        var context = this, args = arguments;
                        var later = function() {
                            timeout = null;
                            func.apply(context, args);
                        };
                        clearTimeout(timeout);
                        timeout = setTimeout(later, wait);
                    };
                    deb.cancel = function (){
                        clearTimeout(timeout);
                    };
                    return deb;
                };

                $scope._model = {
                    isApi: false,
                    label: $attrs.label,
                    tableClass: $attrs.tableClass,
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
                    getPages: getPages,
                    setPage: setPage,
                    refresh: debounce(refresh, 100),
                    waiting: false
                };
                $scope.$grid = {
                    refresh: debounce(resetRefresh, 100),
                    items: function (){ return $scope._model.filteredItems; },
                    noResetRefreshFlag: false
                };



                var loop = $attrs.for.split(' ');
                this.rowName = loop[0];
                if (loop[2]) {
                    $scope.$watchCollection(loop.slice(2).join(' '), function (items, old) {
                        if ($scope.$grid.noResetRefreshFlag) {
                            $scope.$grid.noResetRefreshFlag = false;
                        }
                        else {
                            $scope._model.currentPage = 1;
                        }
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
                    $scope._model.refresh();
                }

                function clearFilters(){
                    angular.forEach($scope._model.cols, function (item){
                       item.filter = '';
                    });
                    $scope._model.refresh();
                }

                function getTooltip(col){
                    if (col.title){
                        return col.title;
                    }
                    if (col.type === 'bool'){
                        return 'Filter using yes, no, true, or false';
                    }else if (col.type){
                        return 'Use a dash (-) to specify a range';
                    }
                }

                function getPages(){

                    var pages = [];
                    for(var i = 1; i <= ($scope._model.total / $scope._model.pageSize) +1; i++){
                        if (i > $scope._model.currentPage - 5 && i < $scope._model.currentPage + 5){
                            pages.push(i);
                        }
                    }

                    return pages;
                }

                function setPage (page){
                    $scope._model.currentPage = page;
                    refresh();
                }

                function resetRefresh(resetPage){
                    if ($scope.$grid.noResetRefreshFlag || resetPage === false) {
                        $scope.$grid.noResetRefreshFlag = false;
                    }
                    else {
                        $scope._model.currentPage = 1;
                        if ($scope._model.isApi) {
                            $scope._model.filteredItems = null;
                        }
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
                        $scope._model.refresh();
                    }else if ($scope._model.sort > item.index){
                        $scope._model.sort += 1;
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

                        if ($scope._model.sort >= index){
                            $scope._model.sort -= 1;
                            if ($scope._model.sort === -1){
                                $scope._model.sort = null;
                            }
                        }
                    }
                };

                this.setDataSource = function (dataSource){
                    $timeout(function(){
                    $scope._model.getItems = dataSource;
                    $scope._model.isApi = true;
                    $scope._model.refresh.cancel();
                    $scope.$grid.refresh.cancel();
                    $scope._model.refresh = debounce(refresh, 1000);
                    $scope.$grid.refresh  = debounce(resetRefresh, 1000);
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
                        if(val !== old){
                            if (angular.isString(val)){
                                $scope._model.filterText = val;
                            }
                            $scope._model.refresh();
                        }
                    });
                }
            }
        };
    }

    angular.module('db-grid').directive('dbGrid', dbGrid);
})();
