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
	setupSearch();
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', fillSocialDetails);
	$("#SubscribeEmail").keyup(function(){
		var email = $("#SubscribeEmail").val();
		if(email != 0)
		{
			if(isValidEmailAddress(email))
				SetBorderColor("SubscribeEmail", false);
			else 
				SetBorderColor("SubscribeEmail", true);
		} 
		else 
			SetBorderColor("SubscribeEmail", false);
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
				isArabic ? alert("انت مشترك اصلا") : alert("You Are already subscribed");
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
					isArabic ? alert("تم إرسال الاشتراك بنجاح") : alert("Subscribtion has been succefully submitted");
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
	$("#lnkCommunity,#lnkCommunity2,#lnkCommunity3").text(isArabic?"مجتمع CHS":"CHS Community");
	$("#lnkResearchTheme,#lnkResearchTheme2,#lnkResearchTheme3").text(isArabic?"مواضيع البحث":"Research Themes");
	$("#lnkPublicaation,#lnkPublicaation2,#lnkPublicaation3").text(isArabic?"النشر":"Publications");
	$("#lnkEvent,#lnkEvent2,#lnkEvent3").text(isArabic?"المناسبات":"Events");
	$("#lnkPublicEngagement,#lnkPublicEngagement2,#lnkPublicEngagement3").text(isArabic?"المشاركة العامة":"Public Management");
	$("#lnkBlogs,#lnkBlogs2,#lnkBlogs3").text(isArabic?"المدونة":"Blogs");
	$("#lnkNews,#lnkNews2,#lnkNews3").text(isArabic?"الأخبار":"News");
	$("#lnkContactUs,#lnkContactUs2,#lnkContactUs3").text(isArabic?"اتصل بنا":"Contact Us");
	$("#lnkTermsOfUse").text(isArabic?"شروط الاستخدام":"Terms of Use");

	$("#HomeAnchor").attr("href",commonUrl+"Home.aspx");
	$("#lnkAboutUs,#lnkAboutUs2,#lnkAboutUs3").attr("href",commonUrl+"About.aspx");
	$("#lnkCommunity,#lnkCommunity2,#lnkCommunity3").attr("href",commonUrl+"CHSCommunity.aspx");
	$("#lnkResearchTheme,#lnkResearchTheme2,#lnkResearchTheme3").attr("href",commonUrl+"ResearchTheme.aspx");
	$("#lnkPublicaation,#lnkPublicaation2,#lnkPublicaation3").attr("href",commonUrl+"Publication.aspx");
	$("#lnkEvent,#lnkEvent2,#lnkEvent3").attr("href",commonUrl+"Events.aspx");
	$("#lnkPublicEngagement,#lnkPublicEngagement2,#lnkPublicEngagement3").attr("href",commonUrl+"PublicManagement.aspx");
	$("#lnkBlogs,#lnkBlogs2,#lnkBlogs3").attr("href",commonUrl+"Blogs.aspx");
	$("#lnkNews,#lnkNews2,#lnkNews3").attr("href",commonUrl+"News.aspx");
	$("#lnkContactUs,#lnkContactUs2,#lnkContactUs3").attr("href",commonUrl+"ContactUs.aspx");
	$("#lnkTermsOfUse").attr("href",commonUrl+"TermOfUse.aspx");


	$("#textConflictCentre").text(isArabic?"مركز دراسات النزاع والعمل الإنساني":"Center for Conflict and Humanitarian Studies");
	$("#textConflictCentreCopyright").text(isArabic?"جميع الحقوق محفوظة©":"© Center for Conflict and Humanitarian Studies");
	$("#textRelatedWebsites").text(isArabic?"مواقع ذات صلة":"Related Websites");
	$("#textArabCentre").text(isArabic?"مراكز عربية في:":"Arab Center in:");
	$("#textParis").text(isArabic?"باريس":"Paris");
	$("#textWashington").text(isArabic?"واشنطن":"Washington");
	$("#textTunis").text(isArabic?"تونس":"Tunis");
	$("#textSubscribe").text(isArabic?"اشترك لتلقي التحديثات":"Subscribe for updates");
	$("#SubscribeEmail").attr("placeholder",isArabic?"البريد الإلكتروني":"Email address");
}

function setUpOtherData(){
	$("#siteLogo1,#siteLogo2,#siteLogo3").attr("src",_spPageContextInfo.webLogoUrl+"?width=300&height=130");
}

function fillSocialDetails() {
	let ctx = SP.ClientContext.get_current();
	let listCollection = ctx.get_site().get_rootWeb().get_lists();
	let socialList = listCollection.getByTitle(_listTitleSocialDetails);
	var allItemsQuery = SP.CamlQuery.createAllItemsQuery();
	let socialItems = socialList.getItems(allItemsQuery);
	ctx.load(socialItems);
	ctx.executeQueryAsync(function () {
			for (let i = 0; i < socialItems.get_count(); i++) {

				let eachItem = socialItems.getItemAtIndex(i);
				let socialTitle=eachItem.get_item('Title');
				let socialUrl=eachItem.get_item('SocialSiteUrl');

				if(socialTitle=="Facebook"){
					$("#fbAnchor,#fbAnchor2,#fbAnchor3,#fbAnchor4").attr("href",socialUrl);
				}

				if(socialTitle=="Twitter"){
					$("#twitterAnchor,#twitterAnchor2,#twitterAnchor3,#twitterAnchor4").attr("href",socialUrl);
				}

				if(socialTitle=="LinkedIn"){
					$("#linkedInAnchor,#linkedInAnchor2,#linkedInAnchor3,#linkedInAnchor4").attr("href",socialUrl);
				}
			}
	}, failure);

	let currentUrl=window.location.href;
	$("#shareFB").attr("href","https://www.facebook.com/sharer/sharer.php?u="+currentUrl);
	$("#shareTwitter").attr("href","https://twitter.com/intent/tweet?url="+currentUrl);
	$("#shareLinkedIn").attr("href","https://www.linkedin.com/sharing/share-offsite/?url="+currentUrl);

	let siteName=isArabic?"Motife Site Arabic":"Motife Site";
	let altImgText=isArabic?"Image missing from motife site":"Image missing from motife site";
	$("head").append("<meta property='og:site_name' content='"+siteName+"'>");
	$("head").append("<meta name='twitter:site' content='"+siteName+"'>");
	$("head").append("<meta name='twitter:image:alt' content='"+altImgText+"'>");
	$("head").append("<meta property='og:url' content='"+currentUrl+"'>");
}

function setupSearch(){

	$("#ddlContentType").append(isArabic?"<option value='0'>All Categories</option>":"<option value='0'>All Categories</option>");
	$("#ddlContentType").append(isArabic?"<option value='PublicationCType'>Publications</option>":"<option value='PublicationCType'>Publications</option>");
	$("#ddlContentType").append(isArabic?"<option value='BlogContentType'>Blogs</option>":"<option value='BlogContentType'>Blogs</option>");
	$("#ddlContentType").append(isArabic?"<option value='NewsCType'>News</option>":"<option value='NewsCType'>News</option>");

	$("#txtSearchBox").keyup(function(e){
		var code = e.key; // recommended to use e.key, it's normalized across devices and languages
		if(code==="Enter"){
			let searchText=$("#txtSearchBox").val();
			let contentType=$("#ddlContentType").val();
			window.location.replace("Search.aspx?searchText="+encodeURI(searchText)+"&CType="+encodeURI(contentType));
		}
	});

	$("#btnSearchMobile").on("click",function(){
			let searchText=$("#txtSearchBox").val();
			let contentType=$("#ddlContentType").val();
			window.location.replace("Search.aspx?searchText="+encodeURI(searchText)+"&CType='"+encodeURI(contentType));
	});
}