describe('page', function() {
    'use strict';
    beforeEach(module('db-grid'));

    it('should return a page of results', inject(function($filter) {

        var filter = $filter('page');
        var results = filter([1,2,3,4,5,6,7,8,9], 1, 4);

        expect(results).toEqual([5,6,7,8]);

    }));

    it('should default to page 0, and 25 results', inject(function($filter) {

        var filter = $filter('page');
        var results = filter([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26]);

        expect(results.length).toEqual(25);

        expect(results[0]).toEqual(1);

    }));

    it('should handle falsey arrays', inject(function($filter) {

        var filter = $filter('page');
        var results = filter(null, 1,4);

        expect(results).toEqual([]);
    }));

});