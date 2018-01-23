/*! 
 * db-grid
 * Lightweight angular grid
 * @version 1.1.12 
 * 
 * Copyright (c) 2018 David Benson, Steve Gentile 
 * @link https://github.com/SMARTDATASYSTEMSLLC/db-grid 
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

  angular.module('db-grid').filter('camelCase', camelCase);
})();

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
    complexFilter.$inject = ["$filter"];

    angular.module('db-grid').filter('complexFilter', complexFilter);
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

  angular.module('db-grid').filter('labelCase', labelCase);
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

    angular.module('db-grid').filter('page', page);
})();


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

                if ($scope._col.colClass){
                  $element.addClass($scope._col.colClass);
                }
            }
        };
    }
    dbBindCell.$inject = ["$compile"];


    angular.module('db-grid').directive('dbBindCell', dbBindCell);
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
    dbCol.$inject = ["$interpolate"];

    angular.module('db-grid').directive('dbCol', dbCol);
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

                var row = tElement.find('tbody').children();
                row.attr('ng-repeat', loop[0] + ' in _model.filteredItems');

                var click = tAttrs.rowClick;
                if (click){
                   row.attr('ng-click', click);
                }

                var rowCss = tAttrs.rowCss;
                if (rowCss){
                    row.attr('ng-class', rowCss);
                }
            },
            controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs){
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
                    toolbarHtml: $attrs.toolbarHtml || 'db-grid/table-directives/db-grid-toolbar.html',
                    label: $attrs.label,
                    tableClass: $attrs.tableClass,
                    pagingLayout: $attrs.pagingLayout || 'bottom',
                    currentPage: 1,
                    total: 0,
                    sortAsc: $attrs.sort ? $attrs.sort[0] !== '-' : true,
                    sort: null,
                    filterText: null,
                    showAdvancedFilter: false,
                    pageSize: $attrs.pageSize ? parseInt($attrs.pageSize, 10) : 25,
                    filterType: ($attrs.filter || 'advanced').toLowerCase(),
                    cols: [],
                    savePlace: $attrs.savePlace,
                    placeLoaded: false,
                    items: null,
                    filteredItems: null,
                    getTooltip: getTooltip,
                    getItems: defaultGetItems,
                    toggleSort: toggleSort,
                    clearFilters: clearFilters,
                    getPages: getPages,
                    setPage: setPage,
                    refreshFilter: debounce(refreshFilter, 100),
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
                    saveState();
                    $scope._model.refresh();
                }

                function clearFilters(){
                    angular.forEach($scope._model.cols, function (item){
                       item.filter = '';
                    });
                    saveState();
                    $scope._model.refresh();
                }

                function getTooltip(col){
                    if (col.title){
                        return col.title;
                    }
                    if (col.type === 'bool'   && col.trueFilter          && col.falseFilter) {
                        return 'Filter using ' + col.trueFilter + ' and ' + col.falseFilter;
                    }else if (col.type === 'bool'){
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
                    saveState();
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

                function refreshFilter(){
                    $scope._model.currentPage = 1;
                    saveState();
                    refresh();
                }

                function refresh() {
                    if (!$scope._model.placeLoaded  && (($scope._model.items && $scope._model.items.length) || $scope._model.isApi)) {
                        loadState();
                        $scope._model.placeLoaded = true;
                    }
                    $scope._model.getItems(
                        $scope._model.showAdvancedFilter ? $scope._model.cols : $scope._model.filterText,
                        $scope._model.sort !== null ? ($scope._model.cols[$scope._model.sort] || {}).key : null,
                        $scope._model.sortAsc,
                        $scope._model.currentPage - 1,
                        $scope._model.pageSize,
                        $scope._model.cols
                    ).then(function (result){
                        $scope._model.filteredItems = result;

                    });
                }

                function saveState(){
                    if ($scope._model.savePlace){
                        window.sessionStorage.setItem($attrs.id || $attrs.savePlace.toLowerCase() !==  "true" ? $attrs.savePlace : $attrs.for, JSON.stringify({
                            filterText: $scope._model.filterText,
                            showAdvancedFilter: $scope._model.showAdvancedFilter,
                            sort: $scope._model.sort,
                            sortAsc: $scope._model.sortAsc,
                            currentPage: $scope._model.currentPage,
                            filters: $scope._model.cols.map(function (v){ return v.filter; })
                        }));
                    }
                }

                function loadState(){
                    if ($scope._model.savePlace){
                        var saved = JSON.parse(window.sessionStorage.getItem($attrs.id || $attrs.savePlace.toLowerCase() !==  "true" ? $attrs.savePlace : $attrs.for));
                        if (saved && saved.currentPage) {
                            $scope._model.filterText = saved.filterText;
                            $scope._model.showAdvancedFilter = saved.showAdvancedFilter;
                            $scope._model.sort = saved.sort;
                            $scope._model.sortAsc = saved.sortAsc;
                            $scope._model.currentPage = saved.currentPage;

                            angular.forEach(saved.filters, function (v, i){
                                $scope._model.cols[i].filter = v;
                            });
                        }
                    }
                }

                this.addColumn = function (item){
                    var sort = $attrs.sort || '';
                    if (sort[0] === '-' || sort[0] === '+'){
                        sort = sort.slice(1);
                    }

                    if (sort && sort === item.key && $scope._model.sort === null){
                        $scope._model.sort = $scope._model.cols.length;
                        $scope._model.refresh();
                    }else if ( $scope._model.sort !== null && $scope._model.sort >= item.index){
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

                this.setAdvanced = function (advanced){
                    $scope._model.showAdvancedFilter = advanced;
                };

                this.refresh = function (force){
                    if ($scope._model.items || force){
                        resetRefresh();
                    }
                };

                if($attrs.query !== undefined){
                    $attrs.$observe('query', function (val, old){
                        if(val && val !== old){
                            if (angular.isString(val)){
                                $scope._model.filterText = val;
                            }
                            $scope._model.placeLoaded = true;
                            //saveState();
                            $scope._model.refresh();
                        }
                    });
                }
            }]
        };
    }
    dbGrid.$inject = ["$filter", "$timeout", "$q", "$log"];

    angular.module('db-grid').directive('dbGrid', dbGrid);
})();

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

(function () {
    "use strict";

    // Removes the control from the parent angular form.

    function isolateControl() {
        return {
            restrict: 'A',
            require: ['ngModel', '^?form'],
            link: function (scope, elm, attrs, ctrls) {
                // Do a copy of the controller
                //var ctrlCopy = {};
                //angular.copy(ctrls[0], ctrlCopy);

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

    angular.module('db-grid').directive('isolateControl', isolateControl);
})();

angular.module('db-grid').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('db-grid/table-directives/db-grid-toolbar.html',
    "<a ng-if=\"_model.showAdvancedFilter\" href=\"\" class=\"btn btn-default\" ng-click=\"_model.clearFilters()\">Clear All Filters <span class=\"big-x\">&times;</span></a> <div ng-if=\"!_model.showAdvancedFilter && _model.filterType !== 'none'\" class=\"toolbar-input\"> <div class=\"form-group has-feedback\"> <input class=\"form-control\" type=\"text\" ng-model=\"_model.filterText\" ng-keyup=\"_model.refreshFilter()\" placeholder=\"Filter {{_model.label || 'items'}}\" isolate-control> <a href=\"\" ng-click=\"_model.filterText = ''; $grid.refresh()\" class=\"form-control-feedback feedback-link\">&times;</a> </div> </div> <a href=\"\" ng-if=\"_model.filterType === 'advanced'\" class=\"btn btn-default\" ng-class=\"{'btn-primary': _model.showAdvancedFilter}\" ng-click=\"_model.showAdvancedFilter = !_model.showAdvancedFilter\">{{_model.showAdvancedFilter ? 'Simple' : 'Advanced'}} Filtering</a>"
  );


  $templateCache.put('db-grid/table-directives/db-grid.html',
    "<div class=\"table-responsive db-grid\"> <div class=\"btn-toolbar\"> <ng-include src=\"_model.toolbarHtml\"></ng-include> <db-transclude></db-transclude> <p ng-if=\"_model.total && _model.label\"><i>{{_model.total}} {{_model.label}}</i></p> </div> <ul class=\"pagination\" ng-if=\"_model.total > _model.pageSize && !_model.waiting && (_model.pagingLayout === 'both' || _model.pagingLayout === 'top')\"> <li ng-if=\"_model.currentPage > 1\"> <a href=\"\" aria-label=\"First\" ng-click=\"_model.setPage(1)\"> <span aria-hidden=\"true\">First</span> </a> </li> <li class=\"disabled\" ng-if=\"_model.currentPage <= 1\"> <a href=\"\" aria-label=\"First\"> <span aria-hidden=\"true\">First</span> </a> </li> <li ng-if=\"_model.currentPage > 1\"> <a href=\"\" aria-label=\"Previous\" ng-click=\"_model.setPage(_model.currentPage - 1)\"> <span aria-hidden=\"true\">&lt;</span> </a> </li> <li class=\"disabled\" ng-if=\"_model.currentPage <= 1\"> <a href=\"\" aria-label=\"Previous\"> <span aria-hidden=\"true\">&lt;</span> </a> </li> <li ng-repeat=\"page in _model.getPages()\" ng-class=\"{active: page === _model.currentPage}\"> <a href=\"\" ng-click=\"_model.setPage(page)\">{{page}}</a> </li> <li ng-if=\"_model.currentPage < (_model.total / _model.pageSize)\"> <a href=\"\" aria-label=\"Next\" ng-click=\"_model.setPage(_model.currentPage + 1)\"> <span aria-hidden=\"true\">&gt;</span> </a> </li> <li class=\"disabled\" ng-if=\"_model.currentPage >= (_model.total / _model.pageSize)\"> <a href=\"\" aria-label=\"Next\" class=\"disabled\"> <span aria-hidden=\"true\">&gt;</span> </a> </li> <li ng-if=\"_model.currentPage < (_model.total / _model.pageSize)\"> <a href=\"\" aria-label=\"Last\" ng-click=\"_model.setPage(1 + (_model.total - (_model.total % _model.pageSize)) / _model.pageSize)\"> <span aria-hidden=\"true\">Last ({{1 + (_model.total - (_model.total % _model.pageSize)) / _model.pageSize}})</span> </a> </li> <li class=\"disabled\" ng-if=\"_model.currentPage >= (_model.total / _model.pageSize)\"> <a href=\"\" aria-label=\"Last\" class=\"disabled\"> <span aria-hidden=\"true\">Last ({{1 + (_model.total - (_model.total % _model.pageSize)) / _model.pageSize}})</span> </a> </li> </ul> <table class=\"table db-grid table-hover {{_model.tableClass}}\"> <thead> <tr ng-if=\"_model.showAdvancedFilter\"> <th ng-repeat=\"_col in _model.cols\" ng-style=\"{width: _col.width}\" class=\"{{_col.colClass}}\"> <div ng-if=\"::_col.canSort\"> <input type=\"text\" class=\"form-control filter-input\" ng-keyup=\"_model.refreshFilter()\" ng-model=\"_col.filter\" placeholder=\"Filter {{::_col.label || (_col.key | labelCase)}}\" tooltip=\"{{_model.getTooltip(_col)}}\" tooltip-trigger=\"focus\" tooltip-placement=\"top\" isolate-control> </div>   <tr> <th ng-repeat=\"_col in _model.cols\" ng-style=\"{width: _col.width}\" class=\"{{_col.colClass}}\"> <a href=\"\" ng-if=\"::_col.canSort\" ng-click=\"_model.toggleSort($index)\">{{::_col.label || (_col.key | labelCase) }}&nbsp;<i class=\"fa\" style=\"display: inline\" ng-class=\"{\n" +
    "                         'fa-sort'     : _model.sort !== $index,\n" +
    "                         'fa-sort-down': _model.sort === $index &&  _model.sortAsc,\n" +
    "                         'fa-sort-up'  : _model.sort === $index && !_model.sortAsc\n" +
    "                         }\"></i> </a> <span ng-if=\"::!_col.canSort\"> {{::_col.label || (_col.key | labelCase)}} </span>    <tbody ng-show=\"!_model.waiting\"> <tr> <td ng-repeat=\"_col in _model.cols\" db-bind-cell>   </table> <div ng-if=\"_model.filteredItems && _model.filteredItems.length === 0 && _model.label && !_model.waiting\" class=\"db-summary\"> No {{_model.label}}. </div> <ul class=\"pagination\" ng-if=\"_model.total > _model.pageSize && !_model.waiting && (_model.pagingLayout === 'both' || _model.pagingLayout === 'bottom')\"> <li ng-if=\"_model.currentPage > 1\"> <a href=\"\" aria-label=\"First\" ng-click=\"_model.setPage(1)\"> <span aria-hidden=\"true\">First</span> </a> </li> <li class=\"disabled\" ng-if=\"_model.currentPage <= 1\"> <a href=\"\" aria-label=\"First\"> <span aria-hidden=\"true\">First</span> </a> </li> <li ng-if=\"_model.currentPage > 1\"> <a href=\"\" aria-label=\"Previous\" ng-click=\"_model.setPage(_model.currentPage - 1)\"> <span aria-hidden=\"true\">&lt;</span> </a> </li> <li class=\"disabled\" ng-if=\"_model.currentPage <= 1\"> <a href=\"\" aria-label=\"Previous\"> <span aria-hidden=\"true\">&lt;</span> </a> </li> <li ng-repeat=\"page in _model.getPages()\" ng-class=\"{active: page === _model.currentPage}\"> <a href=\"\" ng-click=\"_model.setPage(page)\">{{page}}</a> </li> <li ng-if=\"_model.currentPage < (_model.total / _model.pageSize)\"> <a href=\"\" aria-label=\"Next\" ng-click=\"_model.setPage(_model.currentPage + 1)\"> <span aria-hidden=\"true\">&gt;</span> </a> </li> <li class=\"disabled\" ng-if=\"_model.currentPage >= (_model.total / _model.pageSize)\"> <a href=\"\" aria-label=\"Next\" class=\"disabled\"> <span aria-hidden=\"true\">&gt;</span> </a> </li> <li ng-if=\"_model.currentPage < (_model.total / _model.pageSize)\"> <a href=\"\" aria-label=\"Last\" ng-click=\"_model.setPage(1 + (_model.total - (_model.total % _model.pageSize)) / _model.pageSize)\"> <span aria-hidden=\"true\">Last ({{1 + (_model.total - (_model.total % _model.pageSize)) / _model.pageSize}})</span> </a> </li> <li class=\"disabled\" ng-if=\"_model.currentPage >= (_model.total / _model.pageSize)\"> <a href=\"\" aria-label=\"Last\" class=\"disabled\"> <span aria-hidden=\"true\">Last ({{1 + (_model.total - (_model.total % _model.pageSize)) / _model.pageSize}})</span> </a> </li> </ul> <div ng-show=\"_model.waiting\"> <i class=\"fa fa-circle-o-notch fa-spin\"></i> Please Wait... </div> </div>"
  );

}]);
