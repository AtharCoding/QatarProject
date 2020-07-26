"use strict";
var _siteUrl = "";
var _currentEvent = [];
var _latestEventcollection = [];
var _currentAttCollection = [];
var _nextEventCollection = [];
$(document).ready(function () {
	document.title = "Event Details";
	_siteUrl = _spPageContextInfo.webAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', eventDetailStart);
});

function eventDetailStart() {
	const urlParams = new URLSearchParams(window.location.search);
	const itemID = urlParams.get('ItemID');
	if (itemID != null) {
		var urlForCurrentEvent = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleEvents + "')/items(" + itemID + ")?"+
									"$select=ID,Title,EventType1,EventStartDate,EventEndDate,EventDesc,EventVenue,EventSpeakerIDs0/Title,EventSpeakerIDs0/ID,EventPartnersIDs0/Title,EventPartnersIDs0/ID,FieldValuesAsHtml,EventVenueMapHtml" +
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
					$("#eventImg").attr("src",resultImgUrl);
				}, function (err) {
					console.error(err);
				});

				if (_currentAttCollection.length > 0) {
					for (let i = 0; i < _currentAttCollection.length; i++) {
						var urlForAttDetails = _siteUrl + "_api/web/getfilebyserverrelativeurl('" + _currentAttCollection[i].ServerRelativeUrl +"')";
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

				$("#eventTitle,#contentEventTitle,#otherEventTitle").text(_currentEvent.Title);

				let eventVenue=_currentEvent.EventVenue;
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
				
				$("#eventContent").html(formatRichTextValue(_currentEvent.EventDesc));
				bindSpeakerAndPartner(_currentEvent);
				bindCalenderEvent(_currentEvent);
				
			} catch (error) {
				console.error(error);
			}
		}).fail(CommonUtil.OnRESTError);
	}
}

function bindSpeakerAndPartner(eachEvent){
	let eventSpeakerList=eachEvent.EventSpeakerIDs0.results;
	let speakerIDs="";
	for(let i=0;i<eventSpeakerList.length;i++){
		speakerIDs+=eventSpeakerList[i].ID+",";
	}
	if(speakerIDs){
		getStaffByCommaSaperateIDs(speakerIDs,0,function(staffCollectionResult,otherObject){
			for(let i=0;i<staffCollectionResult.length;i++){
				let staffDetail=staffCollectionResult[i];
				let speakerContent="<div class='col-lg-6'>"+
										"<a href='"+staffDetail.ProfileDetailPageURL+"'>"+
										"<div class='event-speaker'>"+
											"<img src='"+staffDetail.ProfileImageUrl+"' />"+
										"<div>"+
										"<h4>"+staffDetail.Title+"</h4>"+
										"<p>"+staffDetail.StaffPostion+"</p>"+
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