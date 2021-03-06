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

	//For sharing site
	let metaTitle="Thank you";
	let metaDesc="Motife Contact Thank You.";
	let metaImageUrl=_spPageContextInfo.webLogoUrl;
	$("head").append("<meta property='og:title' content='"+metaTitle+"'>");
	$("head").append("<meta property='og:description' content='"+metaDesc+"'>");
	$("head").append("<meta property='og:image' content='"+metaImageUrl+"'>");
	$("head").append("<meta name='twitter:card' content='"+metaDesc+"'>");
}

function setupLanguage(){
	$("#currentPageName").text(isArabic?"شكرا على الاتصال":"Thanks for contact");
	$("#cardMessageTitle").text(isArabic?"شكرا لرسالتك":"Thank you for your message.");
	$("#cardMessageDesc").text(isArabic?"سوف تحصل على جميع التحديثات الأخرى هنا":"You will get all other updates here.");
	$("#goToHomeAnchor").text(isArabic?"انتقل إلى الصفحة الرئيسية":"GO TO HOMEPAGE");
}