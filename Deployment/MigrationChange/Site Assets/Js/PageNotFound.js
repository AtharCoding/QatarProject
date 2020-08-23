"use strict";
var _siteUrl = "";


$(document).ready(function () {
	document.title = "Page Not Found";
	_siteUrl =_spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', pageNotFoundStart);
});

function pageNotFoundStart() {
	fillLanguageData();
}

function fillLanguageData(){
	$("#pageMsg").text(isArabic?"لم نتمكن من العثور على هذه الصفحة":"We couldn’t find this page.");
	$("#searchSuggestionTitle").text(isArabic?"حاول استخدام بحثنا":"Try using our search");
	$("#txtSearchBox").attr("placeholder",isArabic?"يبحث عن":"Search for...");

	var searchCatValues = {
		AllCategories: isArabic?"جميع الفئات":"All Categories",
		Posts:isArabic?"المشاركات":"Posts",
		Events:isArabic?"الأحداث":"Events"
	};

	$("#ddlSearchOptions").append("<option>"+searchCatValues.AllCategories+"</option>");
	$("#ddlSearchOptions").append("<option>"+searchCatValues.Posts+"</option>");
	$("#ddlSearchOptions").append("<option>"+searchCatValues.Events+"</option>");
	$("#ddlSearchOptions").selectpicker({
		style: "btn-light",
		width: "100%",
	});
}