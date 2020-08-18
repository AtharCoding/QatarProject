"use strict";
var _siteUrl = "";
$(document).ready(function () {
	document.title = isArabic?"شكرا على الاتصال":"Thanks for contact";
	_siteUrl =_spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', contactThanks);
});

function contactThanks() {
	setupLanguage();
}

function setupLanguage(){
	$("#currentPageName").text(isArabic?"شكرا على الاتصال":"Thanks for contact");
	$("#cardMessageTitle").text(isArabic?"شكرا لرسالتك":"Thank you for your message.");
	$("#cardMessageDesc").text(isArabic?"سوف تحصل على جميع التحديثات الأخرى هنا":"You will get all other updates here.");
	$("#goToHomeAnchor").text(isArabic?"انتقل إلى الصفحة الرئيسية":"GO TO HOMEPAGE");
}