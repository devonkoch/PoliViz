angular.module('poliviz.services', [])

.factory('Politicians', function($http){ 
	return { 
		getPoliticianData: function(name){ 
			return $http({ 
				method: 'GET',
				url: '/politician/' + name
			}).then(function(resp){ 
				return resp.data;
			});
		}
	}

})

.factory('dataSets', function($http){ 
	return { 
		getdataSets: function(name){ 
			return $http ({ 
				method: 'GET', 
				url: '/dataSets/' + name
			}).then(function(resp){ 
				return resp.data;
			})
		}
	};
})

.factory('committeeData', function($http){ 
	return { 
		getData: function(){ 
			return $http ({ 
				method: 'GET', 
				url: '/campaignContributions'
			}).then(function(resp){ 
				return resp.data;
			})
		}
	};
})

// This doens't currently work
.factory('indCandidateData', function($http){ 
	return { 
		getData: function(candName){ 
			console.log(candName)
			return $http ({ 
				method: 'POST', 
				data: {"candName": candName},
				url: '/indCandidateData'
			}).then(function(resp){ 
				return resp.data;
			})
		}
	};
})

.factory('statePositions', function() {

	var stateHash = {};

	return stateHash;
});