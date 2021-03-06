"use strict";
var _siteUrl = "";
var _eventFutureCollection = [];
var _eventPastCollection = [];
var _eventListDetails = [];
var eventCounter = 0;
var _pastEventCounter = 0;
var _allTypeFilter = [];
var eventItemsLimit=2;
var _eventStatusValues = {
	AllEvents: "All Events",
	Current: "Current",
	Upcoming: "Upcoming",
	Completed: "Completed"
};
var _eventStatusValuesAr = {
	AllEvents: "كل الأحداث",
	Current: "تيار",
	Upcoming: "القادمة",
	Completed: "منجز"
};

$(document).ready(function () {
	document.title = _listTitleEvents;
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', eventStart);
});

function eventStart() {
	
	var urlForEvent = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleEvents + "')/items?"+
					"$select=ID,Title,EventArabicTitle,EventStartDate,EventEndDate,EventDesc,EventArabicDesc,EventVenue,EventVenueMapHtml,FieldValuesAsHtml," +
					"EventTypeLookup/Title,EventTypeLookup/ID,EventTypeLookup/EventTypeArabic"+
					"&$expand=EventTypeLookup" +
					"&$top=1000&$orderby=Modified desc";
	var get_Event = SPRestCommon.GetItemAjaxCall(urlForEvent);

	$.when(get_Event)
		.then(function (respEvent) {

			try {
				getListDetails(_listTitleEvents,function(resultTitle,resultDesc){
					$("#contentListTitle").text(resultTitle);
					$("#contentListDesc").text(resultDesc);
				});
			} catch (error) {
				console.error(error);
			}

			let fullEventCollection = respEvent.d.results;
			for (var i = 0; i < fullEventCollection.length; i++) {
				let eventEndDate = new Date(fullEventCollection[i].EventEndDate);
				let today = new Date();
				if (today > eventEndDate)
					_eventPastCollection.push(fullEventCollection[i]);
				else
					_eventFutureCollection.push(fullEventCollection[i]);
			}
			$("#filterStatusContent").append("<option>" +(isArabic?_eventStatusValuesAr.AllEvents:_eventStatusValues.AllEvents) + "</option>");
			$("#filterStatusContent").append("<option>" +(isArabic?_eventStatusValuesAr.Current:_eventStatusValues.Current) + "</option>");
			$("#filterStatusContent").append("<option>" +(isArabic?_eventStatusValuesAr.Upcoming:_eventStatusValues.Upcoming) + "</option>");
			$("#filterStatusContent").append("<option>" +(isArabic?_eventStatusValuesAr.Completed:_eventStatusValues.Completed) + "</option>");

			bindAllEvents(_eventFutureCollection, _eventPastCollection,0,eventItemsLimit, function () {
				$("#eventTypeFilter").append("<button class='btn btn-primary all' type='button'>All</button>");
				for (let i = 0; i < _allTypeFilter.length; i++) {
					let eventTypeContent = "<button class='btn btn-light' type='button'>" + _allTypeFilter[i] + "</button>";
					$("#eventTypeFilter").append(eventTypeContent);
				}
				bindEventTypeFilter();
				bindEventStatusFilter();
				bindTimeRangeEvents();
				bindResetFilter();
				filterContent();
				bindLoadMoreEvent();
				loadMoreHideShow();
			});
		}).fail(CommonUtil.OnRESTError);
}

function bindAllEvents(upcomingCollection, pastCollection,startIndex,endIndex, onComplete) {
	$("#eventContent").html("");
	eventCounter = 0;
	if (upcomingCollection.length == 0)
		FillPastCollection(pastCollection,startIndex,endIndex, onComplete);
	else {
		for (var i = startIndex; i < upcomingCollection.length; i++) {
			if(i==endIndex)
				break;
			getImageUrl(upcomingCollection[i], i, function (resultImgUrl, eachEvent) {
				eventCounter++;
				let eventStartDateArr = getFormattedDate(eachEvent.EventStartDate).split(" ");
				let eventEndDateArr = getFormattedDate(eachEvent.EventEndDate).split(" ");
				let EventDesc =isArabic?formatRichTextValue(eachEvent.EventArabicDesc):formatRichTextValue(eachEvent.EventDesc);
				let eventDetailLink=_siteUrl+"/Pages/EventDetails.aspx?ItemID="+eachEvent.ID;

				let EventTypeLookup=isArabic?eachEvent.EventTypeLookup.EventTypeArabic:eachEvent.EventTypeLookup.Title;
				let eventTitle=isArabic?eachEvent.EventArabicTitle:eachEvent.Title;

				var eachEventContent = "<div class='event-list-item'>" +
					"<div class='row'>" +
					"<div class='col-lg-3'>" +
					"<a href='"+eventDetailLink+"' class='event-list-item-img'>" +
					"<img src='" + resultImgUrl + "'>" +
					"</a>" +
					"</div>" +
					"<div class='col-lg-5'>" +
					"<div class='event-list-content'>" +
					"<p class='event-category'>" + EventTypeLookup + "</p>" +
					"<a href='"+eventDetailLink+"'>" +
					"<h2>" + eventTitle + "</h2>" +
					"</a>" +
					"<p>" + EventDesc + "</p>" +
					"</div>" +
					"</div>" +
					"<div class='col-5 col-lg-2'>" +
					"<div class='event-item-date'>" +
					"<div class='event-item-date-fromto'>" +
					"<div class='event-item-date-day'>" + eventStartDateArr[0] + "</div>" +
					"<div class='event-item-date-month'>" + eventStartDateArr[1] + "</div>" +
					"</div>" +
					"<span>-</span>" +
					"<div class='event-item-date-fromto'>" +
					"<div class='event-item-date-day'>" + eventEndDateArr[0] + "</div>" +
					"<div class='event-item-date-month'>" + eventEndDateArr[1] + "</div>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"<div class='col-7 col-lg-2'>" +
					"<a href='"+eventDetailLink+"' class='btn btn-primary go-button'>Register</a>" +
					"</div>" +
					"</div>" +
					"</div>";
				$("#eventContent").append(eachEventContent);

				if (_allTypeFilter.indexOf(EventTypeLookup) == -1)
					_allTypeFilter.push(EventTypeLookup);

				if (eventCounter == upcomingCollection.length)
					FillPastCollection(pastCollection,startIndex,endIndex, onComplete);
			}, failure);
		}
	}
}

function FillPastCollection(pastCollection,startIndex,endIndex, onComplete) {
	_pastEventCounter = 0;
	if (pastCollection.length == 0)
		onComplete();
	else {
		for (var i = startIndex; i < pastCollection.length; i++) {
			if(i==endIndex)
				break;
			getImageUrl(pastCollection[i], i, function (resultImgUrl, eachEvent) {
				_pastEventCounter++;
				let eventStartDateArr = getFormattedDate(eachEvent.EventStartDate).split(" ");
				let eventEndDateArr = getFormattedDate(eachEvent.EventEndDate).split(" ");
				let EventDesc =isArabic?formatRichTextValue(eachEvent.EventArabicDesc):formatRichTextValue(eachEvent.EventDesc);
				let eventDetailLink=_siteUrl+"/Pages/EventDetails.aspx?ItemID="+eachEvent.ID;

				let EventTypeLookup=isArabic?eachEvent.EventTypeLookup.EventTypeArabic:eachEvent.EventTypeLookup.Title;
				let eventTitle=isArabic?eachEvent.EventArabicTitle:eachEvent.Title;

				var eachEventContent = "<div class='event-list-item past-event'>" +
					"<div class='row'>" +
					"<div class='col-lg-3'>" +
					"<div class='event-img'>" +
					"<a href='"+eventDetailLink+"' class='event-list-item-img'>" +
					"<img src='" + resultImgUrl + "'>" +
					"<span>Past Event</span>" +
					"</a>" +
					"</div>" +
					"</div>" +
					"<div class='col-lg-5'>" +
					"<div class='event-list-content'>" +
					"<p class='event-category'>" + EventTypeLookup + "</p>" +
					"<a href='"+eventDetailLink+"'>" +
					"<h2>" + eventTitle + "</h2>" +
					"</a>" +
					"<p>" + EventDesc + "</p>" +
					"</div>" +
					"</div>" +
					"<div class='col-5 col-lg-2'>" +
					"<div class='event-item-date'>" +
					"<div class='event-item-date-fromto'>" +
					"<div class='event-item-date-day'>" + eventStartDateArr[0] + "</div>" +
					"<div class='event-item-date-month'>" + eventStartDateArr[1] + "</div>" +
					"</div>" +
					"<span>-</span>" +
					"<div class='event-item-date-fromto'>" +
					"<div class='event-item-date-day'>" + eventEndDateArr[0] + "</div>" +
					"<div class='event-item-date-month'>" + eventEndDateArr[1] + "</div>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"<div class='col-7 col-lg-2'>" +
					"<a href='"+eventDetailLink+"' class='go-link'>VIEW DETAILS</a>" +
					"</div>" +
					"</div>" +
					"</div>";
				$("#eventContent").append(eachEventContent);

				if (_allTypeFilter.indexOf(EventTypeLookup) == -1)
					_allTypeFilter.push(EventTypeLookup);

				if (_pastEventCounter == pastCollection.length) {
					onComplete();
				}
			}, failure);
		}
	}
}

function filterContent() {
	let finalResult = {};
	finalResult.newFutureCollection = _eventFutureCollection;
	finalResult.newPastCollection = _eventPastCollection;

	let selectedTypeValues = [];
	$("#eventTypeFilter button.btn-primary").each(function (index, item) {
		selectedTypeValues.push($(item).text());
	});
	if (selectedTypeValues.indexOf("All") == -1) {
		filterByType(selectedTypeValues, finalResult);
	}

	var ddlFilterStatus = document.getElementById("filterStatusContent");
	var statusValue = ddlFilterStatus.options[ddlFilterStatus.selectedIndex].value;
	if (statusValue && statusValue != _eventStatusValues.AllEvents) {
		let tempArr = [];
		tempArr.push(statusValue);
		filterByStatus(tempArr, finalResult);
	}

	let fromDateStr = $("#filterFromDate").val();
	if (fromDateStr) {
		let fromDate = new Date(fromDateStr);
		finalResult.newFutureCollection = $.grep(finalResult.newFutureCollection, function (v) {
			let thisStartDate = new Date(v.EventStartDate);
			return thisStartDate >= fromDate;
		});
		finalResult.newPastCollection = $.grep(finalResult.newPastCollection, function (v) {
			let thisStartDate = new Date(v.EventStartDate);
			return thisStartDate >= fromDate;
		});
	}
	let endDateStr = $("#filterEndDate").val();
	if (endDateStr) {
		let endDate = new Date(endDateStr);
		finalResult.newFutureCollection = $.grep(finalResult.newFutureCollection, function (v) {
			let thisEndDate = new Date(v.EventEndDate);
			return thisEndDate <= endDate;
		});
		finalResult.newPastCollection = $.grep(finalResult.newPastCollection, function (v) {
			let thisEndDate = new Date(v.EventEndDate);
			return thisEndDate <= endDate;
		});
	}

	bindAllEvents(finalResult.newFutureCollection, finalResult.newPastCollection, function () {
		console.log("After Event");
	});
}

function bindEventTypeFilter() {
	$("#eventTypeFilter button").on("click", function () {

		$("#eventTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-light");
		$(this).toggleClass("btn btn-light btn btn-primary");

		let allSelectedValues = [];
		$("#eventTypeFilter button.btn-primary").each(function (index, item) {
			allSelectedValues.push($(item).text());
		});

		if (allSelectedValues.length == 0)
			$("#eventTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");

		if (allSelectedValues.indexOf("All") > -1) {
			$("#eventTypeFilter button").removeClass("btn-primary btn-light").addClass("btn-light");
			$("#eventTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");
		}
		filterContent();
	});
}

function bindEventStatusFilter() {
	$("#filterStatusContent").selectpicker({
		style: "btn-light",
		width: "100%",
	});
	$('#filterStatusContent').on('changed.bs.select', function (e, clickedIndex, newValue, oldValue) {
		filterContent();
	});
}

function filterByStatus(filterValue, finalResult) {
	let today = new Date();
	if (filterValue == _eventStatusValues.Upcoming) {
		finalResult.newFutureCollection = $.grep(finalResult.newFutureCollection, function (v) {
			let thisStartDate = new Date(v.EventStartDate);
			return thisStartDate > today;
		});
		finalResult.newPastCollection = $.grep(finalResult.newPastCollection, function (v) {
			let thisStartDate = new Date(v.EventStartDate);
			return thisStartDate > today;
		});
	}

	if (filterValue == _eventStatusValues.Current) {
		finalResult.newFutureCollection = $.grep(finalResult.newFutureCollection, function (v) {
			let thisStartDate = new Date(v.EventStartDate);
			let thisEndDate = new Date(v.EventEndDate);
			return (today == thisStartDate || (today > thisStartDate && today < thisEndDate));
		});
		finalResult.newPastCollection = $.grep(finalResult.newPastCollection, function (v) {
			let thisStartDate = new Date(v.EventStartDate);
			let thisEndDate = new Date(v.EventEndDate);
			return (today == thisStartDate || (today > thisStartDate && today < thisEndDate));
		});
	}

	if (filterValue == _eventStatusValues.Completed) {
		finalResult.newFutureCollection = $.grep(finalResult.newFutureCollection, function (v) {
			let thisEndDate = new Date(v.EventEndDate);
			return thisEndDate < today;
		});
		finalResult.newPastCollection = $.grep(finalResult.newPastCollection, function (v) {
			let thisEndDate = new Date(v.EventEndDate);
			return thisEndDate < today;
		});
	}
}

function filterByType(filterValue, finalResult) {
	finalResult.newFutureCollection = $.grep(finalResult.newFutureCollection, function (v) {
		let eventTypeVal=isArabic?v.EventTypeLookup.EventTypeArabic:v.EventTypeLookup.Title;
		return filterValue.indexOf(eventTypeVal) != -1;
	});
	finalResult.newPastCollection = $.grep(finalResult.newPastCollection, function (v) {
		let eventTypeVal=isArabic?v.EventTypeLookup.EventTypeArabic:v.EventTypeLookup.Title;
		return filterValue.indexOf(eventTypeVal) != -1;
	});
}

function bindTimeRangeEvents() {
	$("#anchorToday").on("click", function () {
		let today = getFormattedDate(new Date());
		$("#filterFromDate").val(getFormattedDate(today));
		$("#filterEndDate").val(getFormattedDate(today));
		filterContent();
	});

	$("#anchorWeek").on("click", function () {
		let date = new Date();
		getWeekRange(date, function (weekStartDate, weekEndDate) {
			$("#filterFromDate").val(weekStartDate);
			$("#filterEndDate").val(weekEndDate);
			filterContent();
		});
	});

	$("#anchorMonth").on("click", function () {
		let date = new Date();
		getMonthRange(date, function (monthStartDate, monthEndDate) {
			$("#filterFromDate").val(monthStartDate);
			$("#filterEndDate").val(monthEndDate);
			filterContent();
		});
	});

	$('#filterFromDate,#filterEndDate').datepicker().on('changeDate', function (ev) {
		filterContent();
	});
}

function bindResetFilter() {
	$("#anchorResetFilter").on("click", function () {
		$("#eventTypeFilter button").removeClass("btn-primary btn-light").addClass("btn-light");
		$("#eventTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");

		$("#filterFromDate").val("");
		$("#filterEndDate").val("");

		//Below will trigger event and call filter, so no need to call filter
		$('#filterStatusContent').selectpicker('val', _eventStatusValues.AllEvents);
	});
}

function bindLoadMoreEvent(){
	$("#eventLoadMore").on("click",function(){
		bindAllEvents(_eventFutureCollection,_eventPastCollection,eventCounter,eventItemsLimit,function(){
			loadMoreHideShow();
			console.log("load more success");
		});
	});
}

function loadMoreHideShow(){
	let collectionLength=_eventFutureCollection.length+_eventPastCollection.length;
	if(collectionLength==0)
		$("#eventLoadMore").hide();
	else
		$("#eventLoadMore").show();
}