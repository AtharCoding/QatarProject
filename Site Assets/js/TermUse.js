"use strict";
var _siteUrl = "";
var _termsListDetails = [];

$(document).ready(function () {
	document.title = "CENTER FOR CONFLICT AND HUMANITARIAN STUDIES";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', termsStart);
});

function termsStart() {
  
	try {
		getListDetails(_listTermsOfUse,function(resultTitle,resultDesc){
			$("#contentListTitle").text(resultTitle);
			$("#contentListDesc").text(resultDesc);
		});
	} catch (error) {
		console.error(error);
	}

}
