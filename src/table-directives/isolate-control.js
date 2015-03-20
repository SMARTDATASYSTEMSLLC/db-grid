(function () {

    function isolateControl() {
        return {
            restrict: 'A',
            require: ['ngModel', '^?form'],
            link: function (scope, elm, attrs, ctrls) {
                // Do a copy of the controller
                var ctrlCopy = {};
                angular.copy(ctrls[0], ctrlCopy);

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

    angular.module('sds-angular-controls').directive('isolateControl', isolateControl);
})();