"use strict";
var _siteUrl = "";
var _termsListDetails = [];
var _getConfig={
    header:{
        'accept':'application/json:odata=verbose'
    }
}
var searchData = [];
var filterBy="";
$(document).ready(function () {
	document.title = "Search";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', SearchStart);
});

function SearchStart() {
	filterBy = "Events";
	var endpoint="";
	switch(filterBy) {
		case "All":
			// code block
			break;
		case "BlogContentType":
			endpoint= _siteUrl+"/_api/search/query?querytext='ContentTypeId:0x010039FBB67A3CAED64FAF28F273431F1211* + path:"+_siteUrl+"*'&selectproperties='Title,BlogArabicTitle,BlogContent,BlogContentArabic,ContentDate,ImageUrl'";
			break;
		case "PublicationCType":
			// code block
			break;
		case "Events":
			endpoint= _siteUrl+"/_api/search/query?querytext='ContentTypeId:0x01009C3CA515D40A5B40BE833310E6FE6888* + path:"+_siteUrl+"*'&selectproperties='Title,EventArabicTitle,EventDesc,EventArabicDesc,EventStartDate,EventEndDate,EventVenue,EventArabicVenue,EventImageUrl'";
			// code block
			break;
		case "NewsCType":
			// code block
			break;
		default:
		  // code block
	  }
	
	var getSearchQuery = SPRestCommon.GetItemAjaxCall(endpoint);
   
	$.when(getSearchQuery)
    .then(function (respSearchQuery) {
		var results = respSearchQuery.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results;
		var col = [];
		results.forEach(function (rItem) {
			var item = {};
			rItem.Cells.results.forEach(function (cell) {
				item[cell.Key] = cell.Value;
			});                
			col.push(item);
		});   
		console.log(col[0].Title);
		console.log(col[0].EventArabicTitle);
		console.log(col[0].EventDesc);
		console.log(col[0].EventArabicDesc);
		console.log(col[0].EventStartDate);
		console.log(col[0].EventEndDate);
		console.log(col[0].EventArabicVenue);
		console.log(col[0].EventImageUrl);
	}).fail(CommonUtil.OnRESTError);

}

