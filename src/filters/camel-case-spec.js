describe('camelCase', function() {
    'use strict';
    beforeEach(module('db-grid'));

    it('should convert the text to camel case', inject(function($filter) {

        var filter = $filter('camelCase');

        expect(filter('input file')).toEqual('inputFile');

    }));

});