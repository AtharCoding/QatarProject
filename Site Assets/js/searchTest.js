"use strict";
var _siteUrl = "";
var _termsListDetails = [];
var _getConfig={
    header:{
        'accept':'application/json:odata=verbose'
    }
}
var searchData = [];
var filter="";
$(document).ready(function () {
	document.title = "Search";
	_siteUrl =_spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', SearchStart);
});

function SearchStart() {
    filter = "News";
    var endpoint=_siteurl+"_api/search/query?querytext='"+filter+"'";
    searchData = [];
    searchData = _getSPRelevantResults(endpoint);
    console.log(searchData);

}
function _getSPRelevantResults(endpoint) {
    return $http.get(endpoint, _getConfig).then(function (d) {                
        var results = d.data.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results;
        var col = [];
        results.forEach(function (rItem) {
            var item = {};
            rItem.Cells.results.forEach(function (cell) {
                item[cell.Key] = cell.Value;
            });                
            col.push(item);
        });            
        return col;
    });
}
