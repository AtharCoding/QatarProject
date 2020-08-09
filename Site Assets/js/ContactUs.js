"use strict";
var _siteUrl = "";
var _contactUsListDetails = [];
var _WebsitelistDetails=[];

$(document).ready(function () {
	document.title = "CENTER FOR CONFLICT AND HUMANITARIAN STUDIES";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', contactUsStart);
});
function contactUsStart() {
	
	try {
		getListDetails(_listContact,function(resultTitle,resultDesc){
			$("#contentListTitle").text(resultTitle);
			$("#contentListDesc").text(resultDesc);
		});
	} catch (error) {
		console.error(error);
	}
	try {
		bindContactData();
	
	} catch (error) {
		console.error(error);
	}
	try{
		$("#email").keyup(function(){

			var email = $("#email").val();
	
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
		
		$(".txtOnly").keypress(function(e) {
			var key = e.keyCode;
			if (key >= 48 && key <= 57) {
				e.preventDefault();
			}
		});
	}
	catch (error) {
		console.error(error);
	}

	$("#contactForm").on('hide.bs.modal', function () {
		//location.reload(true);
		ClearAllFields();

	});
	$("#contactFormLabel").text(!isArabic?"Send us your message":"أرسل لنا رسالتك");
	$("#lblfirstname").text(!isArabic?"First Name":"الاسم الاول");
	$("#lbllastname").text(!isArabic?"Last Name":"الكنية");
	$("#lblemail").text(!isArabic?"Email Address":"عنوان البريد الالكترونى");
	$("#lblsubject").text(!isArabic?"Subject":"موضوع");
	$("#lblMessage").text(!isArabic?"Message":"رسالة");
	$("#SaveContact").text(!isArabic?"SaveContact":"حفظ جهة الاتصال");
	
}


function submitform() {
	if (!HasFormValidateErr()) {
	
		SaveContactData();
	}
	else {
		//Do Nothing
	}
}
function SaveContactData(){
	var listItemData = "";
	listItemData = {
		__metadata: { "type": "SP.Data.ContactUsListItem" },
		"Title": $("#firstname").val(),
		"ContactUsFName": $("#firstname").val(),
		"ContactUsLName": $("#lastname").val(),
		"ContactUsEmail": $("#email").val(),
		"ContactUsSubject": $("#subject").val(),
		"ContactUsMessage": $("#message").val()
	};

	var allItemsUrl= _siteUrl + "/_api/Web/Lists/GetByTitle('"+_listContact+"')/Items";
	SPRestCommon.GetAddListItemAjaxCall(allItemsUrl, _listContact, listItemData)
	.then(function(iar){
		isArabic ? alert("نموذج الاتصال حفظ بنجاح") : alert("Contact Form Save succefully");
		$("#contactForm").modal("hide");
		ClearAllFields();
	})
	.fail(CommonUtil.OnRESTError);
}
function ClearAllFields() {
	$('#firstname').val("");
	$('#firstname').css("border-color", '#ccc');

	$('#lastname').val("");

	$('#email').val("");
	$('#email').css("border-color", '#ccc');

	$('#subject').val("");
	
	$('#message').val("");
	
	
}
function HasFormValidateErr() {
	var has_error = false;
	var is_errored = false;

	var email = $("#email").val();
	is_errored = !isValidEmailAddress(email);
	SetBorderColor("email", is_errored);
	has_error = (is_errored || has_error);

	var firstname = $("#firstname").val();
	is_errored = (IsNullOrEmpty(firstname));
	SetBorderColor("firstname", is_errored);
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
function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(emailAddress);
}


function bindContactData(){
	var context = new SP.ClientContext.get_current();
	var web = context.get_site().get_rootWeb();
	var WebsiteConnectList = web.get_lists().getByTitle(_listWebsite);
			
	var camlQuery = new SP.CamlQuery();
    camlQuery.set_viewXml(
                          "<View><RowLimit>1</RowLimit></View>");	
	var WebsiteConnectListItems = WebsiteConnectList.getItems(camlQuery);
	context.load(WebsiteConnectListItems);
	context.executeQueryAsync(
		function(){
			var WebSiteConnectenum = WebsiteConnectListItems.getEnumerator();
			var innerData = "";
		
			while(WebSiteConnectenum.moveNext()){
				
				var currentItem = WebSiteConnectenum.get_current();
				var ID = currentItem.get_item("ID");
				var Title="";
				var ContactUsVenue="";
				var ContactUsPhone="";
				var ContactUsEmail="";
				var ContactUsMapHtml="";

				if(currentItem.get_item("Title")!=undefined){
					Title= isArabic ? SlicingTitle(currentItem.get_item("WebsiteContactArabicTitle")): SlicingTitle( currentItem.get_item("Title"));
				}
				if(currentItem.get_item("ContactUsVenue")!=undefined){
					ContactUsVenue= isArabic ? SlicingDesc(currentItem.get_item("WebsiteContactArabicVenue")): SlicingDesc( currentItem.get_item("ContactUsVenue"));
				}
				if(currentItem.get_item("ContactUsPhone")!=undefined){
					ContactUsPhone= isArabic ? SlicingTitle(currentItem.get_item("WebsiteContactArabicPhone")): SlicingTitle( currentItem.get_item("ContactUsPhone"));
				}
				if(currentItem.get_item("ContactUsEmail")!=undefined){
					ContactUsEmail= isArabic ? SlicingTitle(currentItem.get_item("WebsiteContactArabicEmail")): SlicingTitle( currentItem.get_item("ContactUsEmail"));
				}
				ContactUsMapHtml = currentItem.get_item("ContactUsMapHtml")==undefined?"":currentItem.get_item("ContactUsMapHtml");
				
				$("#ContactHeading").text(Title);
				$("#ContactAddress").text(ContactUsVenue);
				if(ContactUsVenue){
					$("#ContactAddress").text(ContactUsVenue);
					let googleMapPointerUrl="https://www.google.com/maps/search/?api=1&query='"+ContactUsVenue+"'";
					$("#ContactAddress").attr("href",googleMapPointerUrl);
				}
				
				if(ContactUsPhone){
					$("#ContactNo").text(ContactUsPhone);
					let openDialer = "tel:"+ContactUsPhone+"";
					$("#ContactNo").attr("href",openDialer);
				}
				
				if(ContactUsEmail){
					$("#ContactEmail").text(ContactUsEmail);
					let mailTo = "https://mail.google.com/mail/?view=cm&fs=1&tf=1&to='"+ContactUsEmail+"'";
					$("#ContactEmail").attr("href",mailTo);
				}
				$("#contactmap").append(ContactUsMapHtml);
				$("#btnContactForm").text(!isArabic?"CONTACT US":"اتصل بنا");
			
			}
			
			
		},
		function(){
			console.log('error');
		}
	);
}

