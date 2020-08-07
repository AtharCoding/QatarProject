"use strict";
var _siteUrl = "";

$(document).ready(function () {
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	let browserUrl = window.location.href.toLowerCase();
	let isArabic = browserUrl.indexOf("/ar/") > -1;
	if(isArabic){
		$("#languageAnchor").text("English");
		let englishUrl=browserUrl.replace("/pages/ar/","/pages/");
		$("#languageAnchor").attr("href",englishUrl);

		$("#txtHeaderFooter").text("مركز دراسات الصراع والانسانية");
		$("#txtRelatedWebsite").text("مواقع ذات صلة");
		$("#txtArabCenter").text("المركز العربي في:"); 
		$("#txtSubscribeUpdate").text("اشترك للحصول على التحديثات");
		$("#txtfooter").text("© مركز الدراسات الإنسانية والصراعات");
		
		$("html").attr("dir","rtl");
		$("html").attr("lang","ar");
	}
	else{
		$("#languageAnchor").text("عربي");
		let arabicUrl = browserUrl.replace("/pages/","/pages/ar/");
		$("#languageAnchor").attr("href",arabicUrl);

		$("#txtHeaderFooter").text("Center for Conflict and Humanitarian Studies");
		$("#txtRelatedWebsite").text("Related Websites");
		$("#txtArabCenter").text("Arab Center in:");
		$("#txtSubscribeUpdate").text("Subscribe for updates");
		$("#txtfooter").text("© Center for Conflict and Humanitarian Studies");
		
		$("html").attr("dir","ltr");
		$("html").attr("lang","en-US");
	}	
	CreateNavbars();

	commonForAllPages();
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
	is_errored = (IsNullOrEmpty(SubscribeEmail));
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

function CreateNavbars(){
	let navigation_list_title = "Navigation";
	var urlForNavigations = _siteUrl + "/_api/web/lists/GetByTitle('" + navigation_list_title + "')/items?" + "$orderby=ID asc";
		
	SPRestCommon.GetItemAjaxCall(urlForNavigations)
	.then(function(respNavs){
		let page_url = _siteUrl + "/Pages/" + (isArabic ? "ar/" : "");
		$(".navbar-brand").attr("href", (page_url + "Home.aspx"));
		$(".lnkContactUs").attr("href", (page_url + "ContactUs.aspx"));
		$("#lnkTermsOfUse").attr("href", (page_url + "TermOfUse.aspx"));

		let nav_coll = respNavs.d.results;

		CreateHeaderNavs(page_url, nav_coll);
		CreateMobileNavs(page_url, nav_coll);
		CreateFooterNavs(page_url, nav_coll);

	})
	.fail(function(err){
		console.error(err)
	})
}

function CreateHeaderNavs(pageUrl, navColl){
	let tmpl = "<li class='nav-item'><a class='nav-link' href='#pageUrl#'>#pageTitle#</a></li>";
	$("#ulHeaderNavbar").empty();
	for(let i = 0; i < navColl.length; i++){
		let nav_item = navColl[i];
		$("#ulHeaderNavbar").append(tmpl.replace("#pageUrl#", (pageUrl + nav_item.PageName)).replace("#pageTitle#", (isArabic ? nav_item.TitleArabic : nav_item.Title)))
	}
}

function CreateMobileNavs(pageUrl, navColl){
	let tmpl = "<li class='nav-item'><a class='nav-link' href='#pageUrl#'>#pageTitle#</a></li>";
	$("#ulMobileNavbar").empty();
	for(let i = 0; i < navColl.length; i++){
		let nav_item = navColl[i];
		$("#ulMobileNavbar").append(tmpl.replace("#pageUrl#", (pageUrl + nav_item.PageName)).replace("#pageTitle#", (isArabic ? nav_item.TitleArabic : nav_item.Title)))
	}
}

function CreateFooterNavs(pageUrl, navColl){
	let tmpl = "<li><a href='#pageUrl#'>#pageTitle#</a></li>";
	$("#ulFooterNavbar_1").empty();
	let i = 0;
	for(i; i < navColl.length / 2; i++){
		let nav_item = navColl[i];
		$("#ulFooterNavbar_1").append(tmpl.replace("#pageUrl#", (pageUrl + nav_item.PageName)).replace("#pageTitle#", (isArabic ? nav_item.TitleArabic : nav_item.Title)))
	}

	$("#ulFooterNavbar_2").empty();
	for(i; i < navColl.length; i++){
		let nav_item = navColl[i];
		$("#ulFooterNavbar_2").append(tmpl.replace("#pageUrl#", (pageUrl + nav_item.PageName)).replace("#pageTitle#", (isArabic ? nav_item.TitleArabic : nav_item.Title)))
	}
}