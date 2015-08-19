angular.module('poliviz.committeeController', [])
.controller('committeeController', function($scope, committeeData, contributorsCandidatesData){
  
  //list of abbreviated states
  $scope.states = ["AL","AK","AS","AZ","AR","CA","CO","CT","DE","DC","FM","FL","GA",
                   "GU","HI","ID","IL","IN","IA","KS","KY","LA","ME","MH","MD","MA",
                   "MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND",
                   "MP","OH","OK","OR","PW","PA","PR","RI","SC","SD","TN","TX","UT",
                   "VT","VI","VA","WA","WV","WI","WY"];
 
  var getData = function() {
    committeeData.getData()
      .then(function(data){
        $scope.data = data;
      });
  };

  // Sets the default select/option
  $scope.contrib = 'ALL';
  $scope.partyAffil = 'ALL';
  $scope.candOffice = 'ALL';
  $scope.candState = 'ALL';

  // filters the data based on party affiliation
  $scope.selectFilter = function () {
    committeeData.getData()
      .then(function(data){
        $scope.data = data;
        // if ($scope.contrib !== "ALL") {
        //   $scope.data = $scope.data.filter(function(d){
        //     return d.CAND_OFFICE_ST === $scope.candState;  // NEED TO FIX when data is pulled
        //   });
        // }
        if ($scope.partyAffil !== "ALL") {
          $scope.data = $scope.data.filter(function(d){
            return d.CAND_PTY_AFFILIATION === $scope.partyAffil;
          });
        }
        if ($scope.candOffice !== "ALL") {
          $scope.data = $scope.data.filter(function(d){
            return d.CAND_OFFICE === $scope.candOffice;
          });
        }
        if ($scope.candState !== "ALL") {
          $scope.data = $scope.data.filter(function(d){
            return d.CAND_OFFICE_ST === $scope.candState;
          });
        }
      });
    };
  getData();
})

//directive for displaying chart
.directive("myChart", function($window) {
  return {
    restrict: "EA",
    template: "<svg width='850' height='200'></svg>",
    link: function(scope, elem, attrs) {
      scope.$watchGroup(['data'], function() {
        // remove any previous charts
        d3.selectAll('svg').remove();
        var data = scope.data;
        var contribType = '';

        // check for contribution type selected
        if(scope.contrib === 'ALL') {
          contribType = 'TTL_RECEIPTS';
        } else if(scope.contrib === 'PAC') {
          contribType = 'OTHER_POL_CMTE_CONTRIB';
        } else if(scope.contrib === 'PP') {
          contribType = 'POL_PTY_CONTRIB';
        } else if(scope.contrib === 'I') {
          contribType = 'TTL_INDIV_CONTRIB';
        } else if(scope.contrib === 'C') {
          contribType = 'CAND_CONTRIB';
        } else if(scope.contrib === 'D') {
          contribType = 'TTL_DISB';
        }

        //sort data, largest to smallest contributions
        data.sort(function(a, b) {
          return b[contribType] - a[contribType];
        });

        var height = 800;
        var width = 1050;
        //varibles to move datapoint to new line
        var yCounter = 10;
        var xCounter = 1;
        var rowSize = 50;
        var largestContribution = data[0][contribType];
        var svg = d3.select("my-chart").append("svg")
          .attr("width", width)
          .attr("height", height);
        
        // NOTE: move this into a factory? 
        d3.csv('committee/capitals.csv', function(error, capitals) {

          // create states hash with lat and long of capital abbrevs;
          var stateHash = {}
          capitals.forEach(function(capital) {
            var coords = stateHash[capital.abbrev] = {};
            coords.lat = (-Number(capital.latitude) + 52) * 25;
            coords.long = (Number(capital.longitude) + 140) * 14;
          })

          // Don't move this around;
          var force = d3.layout.force()
              .nodes(data)
              .size([width, height])
              .gravity(.02)
              .charge(0)
              .on("tick", tick)
              .start();

          var circles = svg.selectAll('circle')
              .data(data)
            .enter().append('circle')
              .style('fill', function(d) { //color bubbles based on party affiliation
                if (d["CAND_PTY_AFFILIATION"] === "REP") {
                  return 'red';
                } else if (d["CAND_PTY_AFFILIATION"] === "DEM") {
                  return 'blue';
                } else {
                  return 'green';
                }
              })
              .attr('r', function(d) { //set max and min bubble size for visual purposes
                var radius = function(value) { 
                  if (value < 50) {
                    value = 50;
                  }
                  var minp = 2;
                  var maxp = 30;
                  var minv = Math.pow(1, .5);
                  var maxv = Math.pow(largestContribution, .5);
                  var scale = (maxv-minv) / (maxp-minp);
                  return (Math.pow(value, .5)-minv) / scale + minp;
                }
                d.radius = radius(d[contribType]);
                return radius(d[contribType])
              })
              .call(force.drag);

          d3.select(self.frameElement).style("height", height + "px");

          function collide(alpha) {
            var quadtree = d3.geom.quadtree(data);
            return function(d) {
              var r = d.radius + 10,
                  nx1 = d.x - r,
                  nx2 = d.x + r,
                  ny1 = d.y - r,
                  ny2 = d.y + r;
              quadtree.visit(function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                  var x = d.x - quad.point.x,
                      y = d.y - quad.point.y,
                      l = Math.sqrt(x * x + y * y),
                      r = d.radius + quad.point.radius;
                  if (l < r) {
                    l = (l - r) / l * alpha;
                    d.x -= x *= l;
                    d.y -= y *= l;
                    quad.point.x += x;
                    quad.point.y += y;
                  }
                }
                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
              });
            };
          }

          function tick(e) {

            var k = .2 * e.alpha;

            data.forEach(function(o, i) {
              var coords = stateHash[o.CAND_OFFICE_ST] || {long: 10, lat: 10};
              o.y += ((coords.lat || 10) - o.y) * k;
              o.x += ((coords.long || 10) - o.x) * k;
            });

            circles
                .each(collide(.5))
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });          
          }


          // Helper function to convert number to display as currency
          var convertCurrency = function(number) {
            var rounded = Math.round(number)
            return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          };

          // Add tooltips for bubbles
          var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset([-10, 0])
            .html(function(d) {
              if(scope.contrib === 'ALL') {
                return "<h5>" + d['CAND_NAME'] + "</h5> <div class='miniQuote'> Total Raised:  $" + convertCurrency(d[contribType]) + "</div> \
                        <div class='miniQuote'> PAC Contributions:  $" + convertCurrency(d['OTHER_POL_CMTE_CONTRIB']) + "</div> \
                        <div class='miniQuote'> Political Partry Contributions:  $" + convertCurrency(d['POL_PTY_CONTRIB']) + "</div> \
                        <div class='miniQuote'> Individual Contributions:  $" + convertCurrency(d['TTL_INDIV_CONTRIB']) + "</div> \
                        <div class='miniQuote'> Candidate Contributions:  $" + convertCurrency(d['CAND_CONTRIB']) + "</div> \
                        <div class='miniQuote'> Total Disbursements:  $" + convertCurrency(d['TTL_DISB']) + "</div>";
              } else {
                return "<h5>" + d['CAND_NAME'] + "</h5> <div class='miniQuote'> Total Raised: $" + convertCurrency(d[contribType]) + "</div>";
              }
            });

          circles.call(tip);

          d3.selectAll('circle').on("mouseover", function(d) {
              tip.show(d)
                .style('opacity', 0.8);
            })
            .on('mouseout', function(d) {
              tip.hide(d);
            });
        });

      });
    }
  };
});