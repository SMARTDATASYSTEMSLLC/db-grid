describe('labelCase', function() {
    'use strict';
    beforeEach(module('db-grid'));

    it('should convert the text to label case', inject(function($filter) {

        var filter = $filter('labelCase');

        expect(filter('inputTest')).toEqual('Input Test');

    }));

});