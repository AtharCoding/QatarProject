"use strict";
var _siteUrl = "";
var commonUrl="";

$(document).ready(function () {
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	commonUrl=_siteUrl+(isArabic?"/Ar/Pages/":"/Pages/");

	$("html").attr("lang",isArabic?"ar":"en-US");
	setupMasterLanguage();
	commonForAllPages();
	setUpOtherData();
	$("#SubscribeEmail").keyup(function(){
		var email = $("#SubscribeEmail").val();
		if(email != 0)
		{
			if(isValidEmailAddress(email))
			{
				SetBorderColor("email", false);
			} 
			else {
				SetBorderColor("email", true);
			}
		} 
		else 
		{
			SetBorderColor("email", false);
		}
	});
});
function Subscribe() {
	if (!HasEmailValidateErr()) {
		var email = $("#SubscribeEmail").val();
		var urlForEmailSubscribersList = _siteUrl + "/_api/web/lists/getbytitle('" + _listEmailSubscribers + "')/items?$filter=Title eq '"+email+"'";
		var get_EmailSubscribersList = SPRestCommon.GetItemAjaxCall(urlForEmailSubscribersList);

		$.when(get_EmailSubscribersList)
		.then(function (respEmailSubscribersList) {
			if(respEmailSubscribersList.d.results.length>0){
				alert("You Are already subscribed");
				$('#SubscribeEmail').val("");
				$('#SubscribeEmail').css("border-color", '#ccc');
			}
			else{
				
				//save data to list
				var listItemData = "";
				listItemData = {
					__metadata: { "type": "SP.Data.EmailSubscribersListItem" },
					"Title": $("#SubscribeEmail").val(),
				};

				var allItemsUrl= _siteUrl + "/_api/Web/Lists/GetByTitle('" + _listEmailSubscribers + "')/Items";
				SPRestCommon.GetAddListItemAjaxCall(allItemsUrl, _listEmailSubscribers, listItemData)
				.then(function(iar){
					alert("Subscribtio has been succefully submitted");
					//$("#contactForm").modal("hide");
					$('#SubscribeEmail').val("");
					$('#SubscribeEmail').css("border-color", '#ccc');
				})
				.fail(CommonUtil.OnRESTError);
			}
		}).fail(CommonUtil.OnRESTError);
	}	
}


function HasEmailValidateErr() {
	var has_error = false;
	var is_errored = false;

	var SubscribeEmail = $("#SubscribeEmail").val();
	is_errored = !isValidEmailAddress(SubscribeEmail);
	SetBorderColor("SubscribeEmail", is_errored);
	has_error = (is_errored || has_error);

	return has_error;
}

function IsNullOrEmpty(obj) {
	return (obj === undefined || obj === null || obj === "");
}

function SetBorderColor(elemendId, isErrored) {
	var border_color = isErrored ? "red" : "#ccc";
	$("#" + elemendId).css("border-color", border_color);
}

function setupMasterLanguage(){
	$("#languageAnchor,#languageAnchor2").text(isArabic?"English":"عربي");
	let browserUrl = window.location.href.toLowerCase();
	$("#languageAnchor,#languageAnchor2").attr("href",isArabic?browserUrl.replace("/ar/pages/","/pages/"):browserUrl.replace("/pages/","/ar/pages/"));

	$("#lnkAboutUs,#lnkAboutUs2,#lnkAboutUs3").text(isArabic?"من نحن":"About Us");
	$("#lnkCommunity,#lnkCommunity2,#lnkCommunity3").text(isArabic?"مجتمع":"CHS Community");
	$("#lnkResearchTheme,#lnkResearchTheme2,#lnkResearchTheme3").text(isArabic?"موضوعات البحث":"Research Themes");
	$("#lnkPublicaation,#lnkPublicaation2,#lnkPublicaation3").text(isArabic?"المنشورات":"Publications");
	$("#lnkEvent,#lnkEvent2,#lnkEvent3").text(isArabic?"الأحداث":"Events");
	$("#lnkPublicEngagement,#lnkPublicEngagement2,#lnkPublicEngagement3").text(isArabic?"الإدارة العامة":"Public Management");
	$("#lnkBlogs,#lnkBlogs2,#lnkBlogs3").text(isArabic?"المدونة":"Blogs");
	$("#lnkNews,#lnkNews2,#lnkNews3").text(isArabic?"أخبار":"News");
	$("#lnkContactUs,#lnkContactUs2,#lnkContactUs3").text(isArabic?"اتصل بنا":"Contact Us");
	$("#lnkTermsOfUse").text(isArabic?"شروط الاستخدام":"Terms of Use");

	$("#lnkAboutUs,#lnkAboutUs2,#lnkAboutUs3").attr("href",commonUrl+"About.aspx");
	$("#lnkCommunity,#lnkCommunity2,#lnkCommunity3").attr("href",commonUrl+"CHSCommunity.aspx");
	$("#lnkResearchTheme,#lnkResearchTheme2,#lnkResearchTheme3").attr("href",commonUrl+"ResearchTheme.aspx");
	$("#lnkPublicaation,#lnkPublicaation2,#lnkPublicaation3").attr("href",commonUrl+"Publication.aspx");
	$("#lnkEvent,#lnkEvent2,#lnkEvent3").attr("href",commonUrl+"Events.aspx");
	$("#lnkPublicEngagement,#lnkPublicEngagement2,#lnkPublicEngagement3").attr("href",commonUrl+"Home.aspx");
	$("#lnkBlogs,#lnkBlogs2,#lnkBlogs3").attr("href",commonUrl+"Blogs.aspx");
	$("#lnkNews,#lnkNews2,#lnkNews3").attr("href",commonUrl+"News.aspx");
	$("#lnkContactUs,#lnkContactUs2,#lnkContactUs3").attr("href",commonUrl+"ContactUs.aspx");
	$("#lnkTermsOfUse").attr("href",commonUrl+"TermOfUse.aspx");


	$("#textConflictCentre").text(isArabic?"مركز دراسات الصراع والإنسانية":"Center for Conflict and Humanitarian Studies");
	$("#textConflictCentreCopyright").text(isArabic?"مركز دراسات الصراع والإنسانية ©":"© Center for Conflict and Humanitarian Studies");
	$("#textRelatedWebsites").text(isArabic?"مواقع ذات صلة":"Related Websites");
	$("#textArabCentre").text(isArabic?"المركز العربي في:":"Arab Center in:");
	$("#textParis").text(isArabic?"باريس":"Paris");
	$("#textWashington").text(isArabic?"واشنطن":"Washington");
	$("#textTunis").text(isArabic?"تونس":"Tunis");
	$("#textSubscribe").text(isArabic?"اشترك للحصول على التحديثات":"Subscribe for updates");
	$("#SubscribeEmail").attr("placeholder",isArabic?"عنوان البريد الالكترونى":"Email address");
}

function setUpOtherData(){
	$("#siteLogo1,#siteLogo2,#siteLogo3").attr("src",_spPageContextInfo.webLogoUrl+"?width=300&height=130");
}