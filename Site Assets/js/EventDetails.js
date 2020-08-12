"use strict";
var _siteUrl = "";
var _currentEvent = [];
var _latestEventcollection = [];
var _currentAttCollection = [];
var _nextEventCollection = [];

$(document).ready(function () {
	document.title = "Event Details";
	_siteUrl =_spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', eventDetailStart);
});

function eventDetailStart() {
	setupLanguage();
	const urlParams = new URLSearchParams(window.location.search);
	const itemID = urlParams.get('ItemID')?urlParams.get('ItemID'):urlParams.get('itemid');
	if (itemID != null) {
		var urlForCurrentEvent = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleEvents + "')/items(" + itemID + ")?"+
									"$select=ID,Title,EventArabicTitle,EventStartDate,EventEndDate,EventDesc,EventArabicDesc,EventVenue,EventArabicVenue,EventSpeakerIDs0/Title,EventSpeakerIDs0/ID,EventPartnersIDs0/Title,EventPartnersIDs0/ID,FieldValuesAsHtml,EventVenueMapHtml" +
									"&$expand=EventSpeakerIDs0,EventPartnersIDs0";
		var get_Current_Event = SPRestCommon.GetItemAjaxCall(urlForCurrentEvent);

		var urlForCurrentEventAtt = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleEvents + "')/items(" + itemID + ")/AttachmentFiles";
		var get_Current_Event_Attch = SPRestCommon.GetItemAjaxCall(urlForCurrentEventAtt);

		$.when(get_Current_Event, get_Current_Event_Attch)
		.then(function (respCurrentEvent, respCurrentAttchments) {
			try {
				_currentEvent = respCurrentEvent[0].d;
				_currentAttCollection = respCurrentAttchments[0].d.results;

				getImageUrl(_currentEvent, 0, function (resultImgUrl, eachEvent) {
					$("#eventImg").attr("src",resultImgUrl+"?width=780&height=510");
				}, failure);

				if (_currentAttCollection.length > 0) {
					for (let i = 0; i < _currentAttCollection.length; i++) {
						var urlForAttDetails = _siteUrl + "/_api/web/getfilebyserverrelativeurl('" + _currentAttCollection[i].ServerRelativeUrl +"')";
						var get_AttDetails = SPRestCommon.GetItemAjaxCall(urlForAttDetails);
						$.when(get_AttDetails)
						.then(function (respAttDetails) {
							let attResult=respAttDetails.d;
							var eachEventContent = "<a href='"+_siteUrl+"/_layouts/15/Download.aspx?SourceUrl="+attResult.ServerRelativeUrl+"' class='attachment-download'>"+
														"<span class='attachment-icon'><i></i></span>"+
														"<div>"+
															"<span class='attachment-name'>"+attResult.Name+"</span><br>"+
															"<span class='attachment-details'>"+getSizeStr(attResult.Length)+"</span>"+
														"</div>"+
													"</a>";
							$("#eventAttachments").append(eachEventContent);
						});
					}
				}
				else
					$("#eventAttachments").hide();

					let eventTitle=isArabic?_currentEvent.EventArabicTitle:_currentEvent.Title;
				$("#eventTitle,#contentEventTitle,#otherEventTitle").text(eventTitle);

				let eventVenue=isArabic?_currentEvent.EventArabicVenue:_currentEvent.EventVenue;
				eventVenue=$("<div></div>").append(eventVenue).text();
				if(eventVenue){
					$("#eventVenue,#mapVenue,#mobileVenue").text(eventVenue);
					let googleMapdirectionUrl="https://www.google.com/maps/dir/?api=1&travelmode=driving&destination='"+eventVenue+"'";
					let googleMapPointerUrl="https://www.google.com/maps/search/?api=1&query='"+eventVenue+"'";
					$("#eventVenue,#mapVenue,#mobileVenue").attr("href",googleMapPointerUrl);
					$("#mapVenueGetDirection,#otherVenueGetDirection").attr("href",googleMapdirectionUrl);
				}

				let eventMap=_currentEvent.EventVenueMapHtml;
				if(eventMap){
					eventMap=$(eventMap).attr("width","100%").attr("height","275")[0];
					$("#eventActualMap").prepend(eventMap);
				}
				
				let eventStartDate=_currentEvent.EventStartDate;
				if(eventStartDate){
					$("#eventStartDateOnly1,#eventStartDateOnly2").text(getFormattedDate(eventStartDate));
					$("#eventStartTime1,#eventStartTime2,#eventStartTime3,#eventStartTime4").text(getFormattedTime(eventStartDate));
				}

				let eventEndDate=_currentEvent.EventEndDate;
				if(eventEndDate){
					$("#eventEndDateOnly1,#eventEndDateOnly2").text(getFormattedDate(eventEndDate));
					$("#eventEndTime1,#eventEndTime2,#eventEndTime3,#eventEndTime4").text(getFormattedTime(eventEndDate));

					let eventEndDateObj=new Date(eventEndDate);
					let today=new Date();

					if(today>eventEndDateObj)
						$("#eventRegAndCalender,#eventRegAndCalender2").hide();
				}
				
				let currentEventDesc=isArabic?_currentEvent.EventArabicDesc:_currentEvent.EventDesc;
				currentEventDesc=formatRichTextValue(currentEventDesc);
				$("#eventContent").html(formatRichTextValue(currentEventDesc));
				bindSpeakerAndPartner(_currentEvent);
				bindCalenderEvent(_currentEvent);
				
			} catch (error) {
				console.error(error);
			}
		}).fail(CommonUtil.OnRESTError);
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

	$("#RegisterEventForm").on('hide.bs.modal', function () {
		//location.reload(true);
		ClearAllFields();

	});
	$("#contactFormLabel").text(!isArabic?"Register Event":"تسجيل الحدث");
	$("#lblfirstname").text(!isArabic?"First Name":"الاسم الاول");
	$("#lbllastname").text(!isArabic?"Last Name":"الكنية");
	$("#lblemail").text(!isArabic?"Email Address":"عنوان البريد الالكترونى");
	$("#lblMessage").text(!isArabic?"Message":"رسالة");
	$("#SaveEvent").text(!isArabic?"Submit":"إرسال");
	
}

function bindSpeakerAndPartner(eachEvent){
	let eventSpeakerList=eachEvent.EventSpeakerIDs0.results;
	let speakerIDs=[];
	for(let i=0;i<eventSpeakerList.length;i++){
		speakerIDs.push(eventSpeakerList[i].ID);
	}
	if(speakerIDs){
		getStaffDetailsByQuery(createCamlQueryByIDArr(speakerIDs),0,function(staffCollectionResult,otherObject){
			for(let i=0;i<staffCollectionResult.length;i++){
				let staffDetail=staffCollectionResult[i];
				let speakerContent="<div class='col-lg-6'>"+
										"<a href='"+staffDetail.ProfileDetailPageURL+"'>"+
										"<div class='event-speaker'>"+
											"<img src='"+staffDetail.ImageUrl+"' />"+
										"<div>"+
										"<h4>"+staffDetail.Title+"</h4>"+
										"<p>"+staffDetail.StaffPositionLookup.Title+"</p>"+
										"</div>"+
										"</div>"+
										"</a>"+
									"</div>";
				$("#speakerList").append(speakerContent);
			}
		});
	}

	let eventPartnerList=eachEvent.EventPartnersIDs0.results;
	let partnerIDs="";
	for(let i=0;i<eventPartnerList.length;i++){
		partnerIDs+=eventPartnerList[i].ID+",";
	}
	if(partnerIDs){
		getPartnerByCommaSaperateIDs(partnerIDs,0,function(partnerCollectionResult,otherObject){
			for(let i=0;i<partnerCollectionResult.length;i++){
				let partnerDetail=partnerCollectionResult[i];
				let partnerContent="<img src='"+partnerDetail.PhotoUrl+"' />";
				$("#partnerList").append(partnerContent);
			}
		});
	}
}

function bindCalenderEvent(eachEvent){
	$("#addCalenderEvent,#addCalenderEvent2").on("click",function(){
		CalenderDetailObj.Title=eachEvent.Title;
		CalenderDetailObj.Description=$(eachEvent.EventDesc).html();
		CalenderDetailObj.Place=eachEvent.EventVenue;
		CalenderDetailObj.BeginDateTime=eachEvent.EventStartDate;
		CalenderDetailObj.EndDateTime=eachEvent.EventEndDate;
		getCalenderICSFile(CalenderDetailObj);
	});	
}

function submitRegisterEventform() {
	if (!HasFormValidateErr()) {
	
		SaveEventregisterData();
	}
	else {
		//Do Nothing
	}
}
function SaveEventregisterData(){
	const urlParams = new URLSearchParams(window.location.search);
	const itemID = urlParams.get('ItemID')?urlParams.get('ItemID'):urlParams.get('itemid');
	var email = $("#email").val();
	var urlForEventRegisterList = _siteUrl + "/_api/web/lists/GetByTitle('" + _listEventRegister + "')/items?$filter=EventRegisterEmail eq '"+email+"'";
	var get_EventRegisterList = SPRestCommon.GetItemAjaxCall(urlForEventRegisterList);

	$.when(get_EventRegisterList)
	.then(function (respEventRegisterList) {
		if(respEventRegisterList.d.results.length>0){
			isArabic ? alert("انت مسجل مسبقا") : alert("You Are already registered");
			ClearAllFields();
		}
		else{
			
			var listItemData = "";
			listItemData = {
				__metadata: { "type": "SP.Data.EventRegisterListItem" },
				"EventRegisterID":itemID,
				"Title": $("#firstname").val(),
				"EventRegisterFirstName": $("#lastname").val(),
				"EventRegisterEmail": $("#email").val(),
				"EventRegisterComment": $("#message").val()
			};
		
			var allItemsUrl=_siteUrl + "/_api/Web/Lists/GetByTitle('" + _listEventRegister + "')/Items";
			SPRestCommon.GetAddListItemAjaxCall(allItemsUrl, _listContact, listItemData)
			.then(function(iar){
				isArabic ? alert("سجل الحدث بنجاح") : alert("Event Register succefully");
				$("#RegisterEventForm").modal("hide");
				ClearAllFields();
			})
			.fail(CommonUtil.OnRESTError);
		}
	}).fail(CommonUtil.OnRESTError);
	
}
function ClearAllFields() {
	$('#firstname').val("");
	$('#firstname').css("border-color", '#ccc');

	$('#lastname').val("");

	$('#email').val("");
	$('#email').css("border-color", '#ccc');


	$('#message').val("");
	
	
}
function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(emailAddress);
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

function setupLanguage(){
	$("#eventVenue,#eventVenueTitle1,#eventVenueTitle2,#eventVenueTitle3").text(isArabic?"مكان":"Venue");
	$("#registerEventTitle,#registerEventTitle2").text(isArabic?"سجل لهذا الحدث":"REGISTER FOR this EVENT");
	$("#addCalenderTitle,#addCalenderEvent2").text(isArabic?"إضافة إلى التقويم":"ADD TO CALENDAR");
	$("#titleAttachments").text(isArabic?"المرفقات:":"Attachments:");
	$("#mapVenueGetDirection,#otherVenueGetDirection").text(isArabic?"اتجاه":"Get Directions");
	$("#titleSpeaker").text(isArabic?"مكبرات الصوت":"Speakers");
	$("#titlePartners").text(isArabic?"شركائنا لهذه الأحداث":"Our Partners for this Events");
	$("#titleDateTime,#titleDateTime2").text(isArabic?"التاريخ والوقت":"Date & Time");
	$("#titleEventAbout").text(isArabic?"عن الحدث":"About the Event");
}