"use strict";
var _siteUrl = "";
$(document).ready(function () {
	document.title = isArabic?"حدث شكرا لك":"Event thank you";
	_siteUrl =_spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', eventThanks);
});

function eventThanks() {
	setupLanguage();
}

function setupLanguage(){
	$("#currentPageName").text(isArabic?"حدث شكرا لك":"Event thank you");
	$("#cardMessageTitle").text(isArabic?"شكرا لك على الحجز معنا":"Thank you for your booking with us.");
	$("#cardMessageDesc").text(isArabic?"سوف تحصل على تحديث بخصوص الحدث على هذا الموقع فقط.":"You will get update regarding the event on this website only.");
	$("#goToHomeAnchor").text(isArabic?"انتقل إلى الصفحة الرئيسية":"GO TO HOMEPAGE");
}