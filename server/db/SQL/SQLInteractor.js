var mysql = require('mysql');

//connects to SQL database
var connection = mysql.createConnection({
  user: 'root',
  password: '',
  database: 'PoliticalData'
});

connection.connect();

//gets total contributions for each candidate, ordered by committee name.
var getContributions = function(callback){
  var queryString = 'select CAND_NAME, CAND_PTY_AFFILIATION, CMTE_NM, SUM(TRANSACTION_AMT), CAND_OFFICE_ST, CAND_OFFICE \
  FROM joinedData group by CAND_NAME;';

  connection.query(queryString, function(err, results){
    if(err) console.log(err);
    callback(JSON.stringify(results));
  });
};

//individual candidate data
var getContributionsByName = function(candName, callback){
  var queryString = "select CMTE_ID id, \
                            CMTE_NM committee, \
                            CMTE_st state, \
                            SUM(TRANSACTION_AMT) as $total \
                     FROM joinedData WHERE CAND_ID = '" + candName + "' group by CMTE_NM;";

  connection.query(queryString, function(err, results){
    if(err) console.log(err);
    callback(JSON.stringify(results));
  });
};


//All candidate finance data
var getCandidateFinanceData = function(callback){ 
  var queryString = "select CandFinance.CAND_NAME, CandFinance.CAND_PTY_AFFILIATION, CandFinance.TTL_RECEIPTS, \
  CandFinance.TRANS_FROM_AUTH, CandFinance.TTL_DISB, CandFinance.CAND_CONTRIB, CandFinance.TTL_INDIV_CONTRIB, \
  CandFinance.CAND_OFFICE_ST, CandFinance.OTHER_POL_CMTE_CONTRIB, CandFinance.POL_PTY_CONTRIB, candidate.CAND_OFFICE \
  from CandFinance inner join candidate on CandFinance.CAND_ID = candidate.CAND_ID order by CAND_NAME;";

  connection.query(queryString, function(err, results){
    if(err) console.log(err);
    callback(JSON.stringify(results));
  });
};

//candidate finance data by name
var getCandidateFinanceDataByName = function(candName, callback){ 
  var queryString = "select CAND_NAME, CAND_PTY_AFFILIATION, TTL_RECEIPTS, TRANS_FROM_AUTH, \
  TTL_DISB, CAND_CONTRIB, TTL_INDIV_CONTRIB, CAND_OFFICE_ST, OTHER_POL_CMTE_CONTRIB, POL_PTY_CONTRIB from CandFinance \
  inner join candidate on CandFinance.CAND_ID = candidate.CAND_ID where CAND_NAME = '" + candName + "'order by CAND_NAME;";

  connection.query(queryString, function(err, results){
    if(err) console.log(err);
    callback(JSON.stringify(results));
  });
};

// gets candidate information
var getCandidates = function(callback){ 
  var queryString = "select candidate.CAND_ID id, \
                            candidate.CAND_NAME name, \
                            candidate.CAND_PTY_AFFILIATION party, \
                            candidate.CAND_OFFICE position, \
                            candidate.CAND_ST state, \
                            CandFinance.TTL_RECEIPTS $total, \
                            CandFinance.OTHER_POL_CMTE_CONTRIB $pac, \
                            CandFinance.POL_PTY_CONTRIB $party, \
                            CandFinance.TTL_INDIV_CONTRIB $individual, \
                            CandFinance.CAND_CONTRIB $candidate \
                    from candidate \
                    inner join CandFinance \
                    on candidate.CAND_ID = CandFinance.CAND_ID";

  connection.query(queryString, function(err, results){
    if(err) console.log(err);
    callback(JSON.stringify(results));
  });
};

// get contributor information
var getContributors = function(callback) {
  var queryString = "select committees.CMTE_ID id, \
                            committees.CMTE_NM committee, \
                            committees.CMTE_ST state, \
                            SUM(cont_to_cand.TRANSACTION_AMT) $total \
                     from committees \
                     inner join cont_to_cand \
                     on committees.CMTE_ID = cont_to_cand.CMTE_ID \
                     group by committees.CMTE_ID";

  connection.query(queryString, function(err, results){
    if(err) console.log(err);
    callback(JSON.stringify(results));
  });
};

// get individual contributor information
var getContributorById = function(id, callback) {
  var queryString = "select CAND_ID id, \
                            CAND_NAME name, \
                            CAND_PTY_AFFILIATION party, \
                            CAND_OFFICE position, \
                            CMTE_ST state, \
                            sum(TRANSACTION_AMT) total$ \
                     from joinedData \
                     where CMTE_ID = '" + id + "' group by CAND_ID;";

  connection.query(queryString, function(err, results){
    if(err) console.log(err);
    callback(JSON.stringify(results));
  });
};

module.exports = {
  getContributions : getContributions,
  getContributionsByName : getContributionsByName,
  getCandidateFinanceData : getCandidateFinanceData,
  getCandidateFinanceDataByName : getCandidateFinanceDataByName,
  getCandidates : getCandidates,
  getContributors : getContributors,
  getContributorById : getContributorById
};


