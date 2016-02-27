(function() {
    'use strict';

    angular
        .module('<%=angularAppName%>')
        .component('jhAlertError', jhAlertError);

    function jhAlertError () {
        var component = {
            template: '<div class="alerts" ng-cloak="">' +
                            '<div ng-repeat="alert in vm.alerts" ng-class="[alert.position, {\'toast\': alert.toast}]">' +
                                '<uib-alert ng-cloak="" type="{{alert.type}}" close="alert.close(vm.alerts)"><pre>{{ alert.msg }}</pre></uib-alert>' +
                            '</div>' +
                      '</div>',
            controller: jhAlertErrorController,
            controllerAs: 'vm'
        };

        return component;

        jhAlertErrorController.$inject = ['$scope', 'AlertService', '$rootScope'<% if (enableTranslation) { %>, '$translate'<% } %>];

        function jhAlertErrorController ($scope, AlertService, $rootScope<% if (enableTranslation) { %>, $translate<% } %>) {
            var vm = this;

            vm.alerts = [];

            function addErrorAlert (message, key, data) {
                <%_ if (enableTranslation) { _%>
                key = key && key !== null ? key : message;
                vm.alerts.push(
                    AlertService.add(
                        {
                            type: 'danger',
                            msg: key,
                            params: data,
                            timeout: 5000,
                            toast: AlertService.isToast(),
                            scoped: true
                        },
                        vm.alerts
                    )
                );
                <%_ } else { _%>
                vm.alerts.push(
                    AlertService.add(
                        {
                            type: 'danger',
                            msg: message,
                            timeout: 5000,
                            toast: AlertService.isToast(),
                            scoped: true
                        },
                        vm.alerts
                    )
                );
                <%_ } _%>
            };

            var cleanHttpErrorListener = $rootScope.$on('<%=angularAppName%>.httpError', function (event, httpResponse) {
                var i;
                event.stopPropagation();
                switch (httpResponse.status) {
                    // connection refused, server not reachable
                    case 0:
                        addErrorAlert('Server not reachable','error.server.not.reachable');
                        break;

                    case 400:
                        var errorHeader = httpResponse.headers('X-<%=angularAppName%>-error');
                        var entityKey = httpResponse.headers('X-<%=angularAppName%>-params');
                        if (errorHeader) {
                            var entityName = <% if (enableTranslation) { %>$translate.instant('global.menu.entities.' + entityKey)<% }else{ %>entityKey<% } %>;
                            addErrorAlert(errorHeader, errorHeader, {entityName: entityName});
                        } else if (httpResponse.data && httpResponse.data.fieldErrors) {
                            for (i = 0; i < httpResponse.data.fieldErrors.length; i++) {
                                var fieldError = httpResponse.data.fieldErrors[i];
                                // convert 'something[14].other[4].id' to 'something[].other[].id' so translations can be written to it
                                var convertedField = fieldError.field.replace(/\[\d*\]/g, '[]');
                                var fieldName = <% if (enableTranslation) { %>$translate.instant('<%= angularAppName %>.' + fieldError.objectName + '.' + convertedField)<% }else{ %>convertedField.charAt(0).toUpperCase() + convertedField.slice(1)<% } %>;
                                addErrorAlert('Field ' + fieldName + ' cannot be empty', 'error.' + fieldError.message, {fieldName: fieldName});
                            }
                        } else if (httpResponse.data && httpResponse.data.message) {
                            addErrorAlert(httpResponse.data.message, httpResponse.data.message, httpResponse.data);
                        } else {
                            addErrorAlert(httpResponse.data);
                        }
                        break;

                    default:
                        if (httpResponse.data && httpResponse.data.message) {
                            addErrorAlert(httpResponse.data.message);
                        } else {
                            addErrorAlert(JSON.stringify(httpResponse));
                        }
                }
            });

            $scope.$on('$destroy', function () {
                if(cleanHttpErrorListener !== undefined && cleanHttpErrorListener !== null){
                    cleanHttpErrorListener();
                    vm.alerts = [];
                }
            });
        }
    }


})();