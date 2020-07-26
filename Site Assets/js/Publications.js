"use strict";
var _siteUrl = "";
var _allPublications = [];
var _publicationPastCollection = [];
var _publicationListDetails = [];
var publicationCounter = 0;
var _pastPublicationCounter = 0;
var _allTypeFilter = [];

var _allYearFilterValue="All Years";
var _allAuthorFilterValue="All Authors";
var _allTopicFilterValue="All";

var _publicationStatusValues = {
	AllPublications: "All Publications",
	Current: "Current",
	Upcoming: "Upcoming",
	Completed: "Completed"
};

$(document).ready(function () {
	document.title = "Publications";
	_siteUrl = _spPageContextInfo.webAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', publicationStart);
});

function publicationStart() {
	var urlForPublicationList = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitlePublication + "')";
	var get_PublicationList = SPRestCommon.GetItemAjaxCall(urlForPublicationList);

	var urlForPublication = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitlePublication + "')/items?$top=1000"+
							"&$select=ID,Title,PublicationPreTitle,PublicationPostTitle,PublicationDate,PublicationDetails,IsFeatured1,NoOfViews"+
							",PublicationTopicIDs/Title,PublicationTopicIDs/ID,PublicationAuthorIDs/Title,PublicationAuthorIDs/ID,FieldValuesAsHtml" +
							"&$expand=PublicationTopicIDs,PublicationAuthorIDs";
	var get_Publication = SPRestCommon.GetItemAjaxCall(urlForPublication);

	$.when(get_PublicationList, get_Publication)
		.then(function (respPublicationList, respPublication) {

			try {
				_publicationListDetails = respPublicationList[0].d;
				$("#contentListTitle").text(_publicationListDetails.Title);
				$("#contentListDesc").text(_publicationListDetails.Description);
			} catch (error) {
				console.error(error);
			}
			
			_allPublications = respPublication[0].d.results;
			$("#ddlPublicationYear").append("<option>"+_allYearFilterValue+"</option>");
			$("#ddlPublicationAuthors").append("<option>"+_allAuthorFilterValue+"</option>");
			$("#publicationTopics").append("<button class='btn btn-primary all'>"+_allTopicFilterValue+"</button>");
			let featuredAuthorIDs=[];
			for (var i = 0; i < _allPublications.length; i++) {
				let eachPublication=_allPublications[i];

				let publicationDateStr=eachPublication.PublicationDate;
				if(publicationDateStr){
					let date=new Date(publicationDateStr);
					$("#ddlPublicationYear").append("<option>"+date.getFullYear()+"</option>")
				}

				let publicationAuthorsStr=eachPublication.PublicationAuthorIDs;
				let AuthorIDArr=[];
				if(publicationAuthorsStr){
					let publicationAuthorsArr=eachPublication.PublicationAuthorIDs.results;
					for(let i=0;i<publicationAuthorsArr.length;i++){
						$("#ddlPublicationAuthors").append("<option>"+publicationAuthorsArr[i].Title+"</option>");
						AuthorIDArr.push(publicationAuthorsArr[i].ID);
						if(eachPublication.IsFeatured1)
							featuredAuthorIDs.push(publicationAuthorsArr[i].ID);
					}
				}

				let publicationTopics=eachPublication.PublicationTopicIDs;
				if(publicationTopics){
					$("#publicationTopics").append("<button class='btn btn-light'>"+publicationTopics.Title+"</button>");
				}

				prepareDesign(eachPublication,i,AuthorIDArr);
			}
			$("#ddlPublicationYear,#ddlPublicationAuthors").selectpicker({
				style: "btn-light",
				width: "100%",
			});

			if(featuredAuthorIDs.length>0){
				let featureAuthorIDStr=featuredAuthorIDs.join(',');
				getStaffByCommaSaperateIDs(featureAuthorIDStr,0,function(staffCollectionResult){
					for(let i=0;i<staffCollectionResult.length;i++){
						let authorContent="<div class='author-item '>"+
												"<img src='"+staffCollectionResult[i].ProfileImageUrl+"' />"+
												"<div>"+
													"<a href='"+staffCollectionResult[i].ProfileDetailPageURL+"'>"+
														"<h4>"+staffCollectionResult[i].Title+"</h4>"+
													"</a>"+
													"<p>"+staffCollectionResult[i].StaffPostion+"</p>"+
												"</div>"+
											"</div>";
						$("#featuredAuthorDiv").append(authorContent);

						let carouselAuthorContent="<div class='item'>"+
														"<a href='"+staffCollectionResult[i].ProfileImageUrl+"'>"+
															"<div class='key-researcher'>"+
																"<img src='"+staffCollectionResult[i].ProfileImageUrl+"' />"+
																"<h4>"+staffCollectionResult[i].Title+"</h4>"+
																"<p>"+staffCollectionResult[i].StaffPostion+"</p>"+
															"</div>"+
														"</a>"+
													"</div>";
						$("#featuredAuthorCarousel").append(carouselAuthorContent);
					}
					createOwlSlider();
				});
			}

			// $("#filterStatusContent").append("<option>" + _publicationStatusValues.AllPublications + "</option>");
			// $("#filterStatusContent").append("<option>" + _publicationStatusValues.Current + "</option>");
			// $("#filterStatusContent").append("<option>" + _publicationStatusValues.Upcoming + "</option>");
			// $("#filterStatusContent").append("<option>" + _publicationStatusValues.Completed + "</option>");

			// bindAllPublications(_allPublications, _publicationPastCollection, function () {
			// 	$("#publicationTypeFilter").append("<button class='btn btn-primary all' type='button'>All</button>");
			// 	for (let i = 0; i < _allTypeFilter.length; i++) {
			// 		let publicationTypeContent = "<button class='btn btn-light' type='button'>" + _allTypeFilter[i] + "</button>";
			// 		$("#publicationTypeFilter").append(publicationTypeContent);
			// 	}
			// 	bindPublicationTypeFilter();
			// 	bindPublicationStatusFilter();
			// 	bindTimeRangePublications();
			// 	bindResetFilter();
			// 	filterContent();
			// });
		}).fail(CommonUtil.OnRESTError);
}

function bindAllPublications(upcomingCollection, pastCollection, onComplete) {
	$("#publicationContent").html("");
	publicationCounter = 0;
	if (upcomingCollection.length == 0)
		FillPastCollection(pastCollection, onComplete);
	else {
		for (var i = 0; i < upcomingCollection.length; i++) {
			getImageUrl(upcomingCollection[i], i, function (resultImgUrl, eachPublication) {
				publicationCounter++;
				let publicationStartDateArr = getFormattedDate(eachPublication.PublicationStartDate).split(" ");
				let publicationEndDateArr = getFormattedDate(eachPublication.PublicationEndDate).split(" ");
				let PublicationDesc = formatRichTextValue(eachPublication.PublicationDesc);
				let publicationDetailLink=_siteUrl+"/Pages/PublicationDetails.aspx?ItemID="+eachPublication.ID;
				var eachPublicationContent = "<div class='publication-list-item'>" +
					"<div class='row'>" +
					"<div class='col-lg-3'>" +
					"<a href='"+publicationDetailLink+"' class='publication-list-item-img'>" +
					"<img src='" + resultImgUrl + "'>" +
					"</a>" +
					"</div>" +
					"<div class='col-lg-5'>" +
					"<div class='publication-list-content'>" +
					"<p class='publication-category'>" + eachPublication.PublicationType1 + "</p>" +
					"<a href='"+publicationDetailLink+"'>" +
					"<h2>" + eachPublication.Title + "</h2>" +
					"</a>" +
					"<p>" + PublicationDesc + "</p>" +
					"</div>" +
					"</div>" +
					"<div class='col-5 col-lg-2'>" +
					"<div class='publication-item-date'>" +
					"<div class='publication-item-date-fromto'>" +
					"<div class='publication-item-date-day'>" + publicationStartDateArr[0] + "</div>" +
					"<div class='publication-item-date-month'>" + publicationStartDateArr[1] + "</div>" +
					"</div>" +
					"<span>-</span>" +
					"<div class='publication-item-date-fromto'>" +
					"<div class='publication-item-date-day'>" + publicationEndDateArr[0] + "</div>" +
					"<div class='publication-item-date-month'>" + publicationEndDateArr[1] + "</div>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"<div class='col-7 col-lg-2'>" +
					"<a href='"+publicationDetailLink+"' class='btn btn-primary go-button'>Register</a>" +
					"</div>" +
					"</div>" +
					"</div>";
				$("#publicationContent").append(eachPublicationContent);

				if (_allTypeFilter.indexOf(eachPublication.PublicationType1) == -1)
					_allTypeFilter.push(eachPublication.PublicationType1);

				if (publicationCounter == upcomingCollection.length)
					FillPastCollection(pastCollection, onComplete);
			}, function (err) {
				console.error(err);
			});
		}
	}
}

function FillPastCollection(pastCollection, onComplete) {
	_pastPublicationCounter = 0;
	if (pastCollection.length == 0)
		onComplete();
	else {
		for (var i = 0; i < pastCollection.length; i++) {
			getImageUrl(pastCollection[i], i, function (resultImgUrl, eachPublication) {
				_pastPublicationCounter++;
				let publicationStartDateArr = getFormattedDate(eachPublication.PublicationStartDate).split(" ");
				let publicationEndDateArr = getFormattedDate(eachPublication.PublicationEndDate).split(" ");
				let PublicationDesc = formatRichTextValue(eachPublication.PublicationDesc);
				let publicationDetailLink=_siteUrl+"/Pages/PublicationDetails.aspx?ItemID="+eachPublication.ID;
				var eachPublicationContent = "<div class='publication-list-item past-publication'>" +
					"<div class='row'>" +
					"<div class='col-lg-3'>" +
					"<div class='publication-img'>" +
					"<a href='"+publicationDetailLink+"' class='publication-list-item-img'>" +
					"<img src='" + resultImgUrl + "'>" +
					"<span>Past Publication</span>" +
					"</a>" +
					"</div>" +
					"</div>" +
					"<div class='col-lg-5'>" +
					"<div class='publication-list-content'>" +
					"<p class='publication-category'>" + eachPublication.PublicationType1 + "</p>" +
					"<a href='"+publicationDetailLink+"'>" +
					"<h2>" + eachPublication.Title + "</h2>" +
					"</a>" +
					"<p>" + PublicationDesc + "</p>" +
					"</div>" +
					"</div>" +
					"<div class='col-5 col-lg-2'>" +
					"<div class='publication-item-date'>" +
					"<div class='publication-item-date-fromto'>" +
					"<div class='publication-item-date-day'>" + publicationStartDateArr[0] + "</div>" +
					"<div class='publication-item-date-month'>" + publicationStartDateArr[1] + "</div>" +
					"</div>" +
					"<span>-</span>" +
					"<div class='publication-item-date-fromto'>" +
					"<div class='publication-item-date-day'>" + publicationEndDateArr[0] + "</div>" +
					"<div class='publication-item-date-month'>" + publicationEndDateArr[1] + "</div>" +
					"</div>" +
					"</div>" +
					"</div>" +
					"<div class='col-7 col-lg-2'>" +
					"<a href='"+publicationDetailLink+"' class='go-link'>VIEW DETAILS</a>" +
					"</div>" +
					"</div>" +
					"</div>";
				$("#publicationContent").append(eachPublicationContent);

				if (_allTypeFilter.indexOf(eachPublication.PublicationType1) == -1)
					_allTypeFilter.push(eachPublication.PublicationType1);

				if (_pastPublicationCounter == pastCollection.length) {
					onComplete();
				}
			}, function (err) {
				console.error(err);
			});
		}
	}
}

function filterContent() {
	let finalResult = {};
	finalResult.newFutureCollection = _allPublications;
	finalResult.newPastCollection = _publicationPastCollection;

	let selectedTypeValues = [];
	$("#publicationTypeFilter button.btn-primary").each(function (index, item) {
		selectedTypeValues.push($(item).text());
	});
	if (selectedTypeValues.indexOf("All") == -1) {
		filterByType(selectedTypeValues, finalResult);
	}

	var ddlFilterStatus = document.getElementById("filterStatusContent");
	var statusValue = ddlFilterStatus.options[ddlFilterStatus.selectedIndex].value;
	if (statusValue && statusValue != _publicationStatusValues.AllPublications) {
		let tempArr = [];
		tempArr.push(statusValue);
		filterByStatus(tempArr, finalResult);
	}

	let fromDateStr = $("#filterFromDate").val();
	if (fromDateStr) {
		let fromDate = new Date(fromDateStr);
		finalResult.newFutureCollection = $.grep(finalResult.newFutureCollection, function (v) {
			let thisStartDate = new Date(v.PublicationStartDate);
			return thisStartDate >= fromDate;
		});
		finalResult.newPastCollection = $.grep(finalResult.newPastCollection, function (v) {
			let thisStartDate = new Date(v.PublicationStartDate);
			return thisStartDate >= fromDate;
		});
	}
	let endDateStr = $("#filterEndDate").val();
	if (endDateStr) {
		let endDate = new Date(endDateStr);
		finalResult.newFutureCollection = $.grep(finalResult.newFutureCollection, function (v) {
			let thisEndDate = new Date(v.PublicationEndDate);
			return thisEndDate <= endDate;
		});
		finalResult.newPastCollection = $.grep(finalResult.newPastCollection, function (v) {
			let thisEndDate = new Date(v.PublicationEndDate);
			return thisEndDate <= endDate;
		});
	}

	bindAllPublications(finalResult.newFutureCollection, finalResult.newPastCollection, function () {
		console.log("After Publication");
	});
}

function bindPublicationTypeFilter() {
	$("#publicationTypeFilter button").on("click", function () {

		$("#publicationTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-light");
		$(this).toggleClass("btn btn-light btn btn-primary");

		let allSelectedValues = [];
		$("#publicationTypeFilter button.btn-primary").each(function (index, item) {
			allSelectedValues.push($(item).text());
		});

		if (allSelectedValues.length == 0)
			$("#publicationTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");

		if (allSelectedValues.indexOf("All") > -1) {
			$("#publicationTypeFilter button").removeClass("btn-primary btn-light").addClass("btn-light");
			$("#publicationTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");
		}
		filterContent();
	});
}

function bindPublicationStatusFilter() {
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
	if (filterValue == _publicationStatusValues.Upcoming) {
		finalResult.newFutureCollection = $.grep(finalResult.newFutureCollection, function (v) {
			let thisStartDate = new Date(v.PublicationStartDate);
			return thisStartDate > today;
		});
		finalResult.newPastCollection = $.grep(finalResult.newPastCollection, function (v) {
			let thisStartDate = new Date(v.PublicationStartDate);
			return thisStartDate > today;
		});
	}

	if (filterValue == _publicationStatusValues.Current) {
		finalResult.newFutureCollection = $.grep(finalResult.newFutureCollection, function (v) {
			let thisStartDate = new Date(v.PublicationStartDate);
			let thisEndDate = new Date(v.PublicationEndDate);
			return (today == thisStartDate || (today > thisStartDate && today < thisEndDate));
		});
		finalResult.newPastCollection = $.grep(finalResult.newPastCollection, function (v) {
			let thisStartDate = new Date(v.PublicationStartDate);
			let thisEndDate = new Date(v.PublicationEndDate);
			return (today == thisStartDate || (today > thisStartDate && today < thisEndDate));
		});
	}

	if (filterValue == _publicationStatusValues.Completed) {
		finalResult.newFutureCollection = $.grep(finalResult.newFutureCollection, function (v) {
			let thisEndDate = new Date(v.PublicationEndDate);
			return thisEndDate < today;
		});
		finalResult.newPastCollection = $.grep(finalResult.newPastCollection, function (v) {
			let thisEndDate = new Date(v.PublicationEndDate);
			return thisEndDate < today;
		});
	}
}

function filterByType(filterValue, finalResult) {
	finalResult.newFutureCollection = $.grep(finalResult.newFutureCollection, function (v) {
		return filterValue.indexOf(v.PublicationType1) != -1;
	});
	finalResult.newPastCollection = $.grep(finalResult.newPastCollection, function (v) {
		return filterValue.indexOf(v.PublicationType1) != -1;
	});
}

function bindTimeRangePublications() {
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
		$("#publicationTypeFilter button").removeClass("btn-primary btn-light").addClass("btn-light");
		$("#publicationTypeFilter button.all").removeClass("btn-primary btn-light").addClass("btn-primary");

		$("#filterFromDate").val("");
		$("#filterEndDate").val("");

		//Below will trigger publication and call filter, so no need to call filter
		$('#filterStatusContent').selectpicker('val', _publicationStatusValues.AllPublications);
	});
}

function prepareDesign(eachPublication,index,authorIDsArr){

	if(authorIDsArr.length>0){
		let tempObj={};
		tempObj.Index=index;
		tempObj.AuthorID=authorIDsArr[0];
		tempObj.eachPublication=eachPublication;
		getImageUrl(eachPublication,tempObj,function(pubImgUrl,eachPublication,tempObj){
			tempObj.PubImgUrl=pubImgUrl;
			getStaffByCommaSaperateIDs(tempObj.AuthorID,tempObj,function(staffCollectionResult,tempObj){
				let eachPublication=tempObj.eachPublication;
				let staffDetail=staffCollectionResult[0];
				let pubDetails=eachPublication.PublicationDetails;
				let pubDetailUrl=_siteUrl+"/Pages/PublicationDetails.aspx?ItemID="+eachPublication.ID;

				let featuredPublication="<a href='"+pubDetailUrl+"'>"+
											"<div class='publication publication-big'>"+
												"<div class='publication-content'>"+
													"<p class='publication-category'>"+eachPublication.PublicationTopicIDs.Title+"</p>"+
													"<h3 class='publication-title'>"+eachPublication.Title+"</h3>"+
													"<p class='publication-text'>"+SlicingDesc($(pubDetails).text())+"</p>"+
													"<div class='publication-author'>"+
														"<img src='"+staffDetail.ProfileImageUrl+"' alt='...'>"+
														"<span>by "+staffDetail.Title+"</span>"+
													"</div>"+
												"</div>"+
												"<div class='publication-img'>"+
													"<img src='"+tempObj.PubImgUrl+"' alt='...'>"+
												"</div>"+
											"</div>"+
										"</a>";
				let noImageSmall="<a href='"+pubDetailUrl+"'>"+
									"<div class='publication'>"+
										"<div class='publication-content'>"+
											"<p class='publication-category'>"+eachPublication.PublicationTopicIDs.Title+"</p>"+
											"<h3 class='publication-title'>"+eachPublication.Title+"</h3>"+
											"<p class='publication-text'>"+SlicingDesc($(pubDetails).text())+"</p>"+
											"<div class='publication-author'>"+
												"<img src='"+staffDetail.ProfileImageUrl+"' alt='...'>"+
												"<span>by "+staffDetail.Title+"</span>"+
											"</div>"+
										"</div>"+
									"</div>"+
								"</a>";
				let noImageWide="<a href='"+pubDetailUrl+"'>"+
									"<div class='publication'>"+
										"<div class='publication-content'>"+
											"<p class='publication-category'>"+eachPublication.PublicationTopicIDs.Title+"</p>"+
											"<h3 class='publication-title'>"+eachPublication.Title+"</h3>"+
											"<p class='publication-text'>"+SlicingDesc($(pubDetails).text())+"</p>"+
											"<div class='publication-author'>"+
												"<img src='"+staffDetail.ProfileImageUrl+"' alt='...'>"+
												"<span>by "+staffDetail.Title+"</span>"+
											"</div>"+
										"</div>"+
									"</div>"+
								"</a>";
				let withImageVertical="<a href='"+pubDetailUrl+"'>"+
											"<div class='publication' style='height: 95%;'>"+
												"<div class='publication-content'>"+
													"<div class='publication-card-img'>"+
														"<img src='"+tempObj.PubImgUrl+"' alt='...'>"+
													"</div>"+
													"<p class='publication-category'>"+eachPublication.PublicationTopicIDs.Title+"</p>"+
													"<h3 class='publication-title'>"+eachPublication.Title+"</h3>"+
													"<p class='publication-text'>"+SlicingDesc($(pubDetails).text())+"</p>"+
													"<div class='publication-author'>"+
														"<img src='"+staffDetail.ProfileImageUrl+"' alt='...'>"+
														"<span>by "+staffDetail.Title+"</span>"+
													"</div>"+
												"</div>"+
											"</div>"+
										"</a>";
				let outerStartHtml="<div class='row'>";
				let outerEndHtml="</div>";
				let startHtml="";
				let endHtml="";
				contentHtml="";
				if(tempObj.Index==1){
					startHtml="<div class='row'>"+
								"<div class='col-lg-12'>";
					endHtml="</div>"+
								"</div>";
					contentHtml=startHtml+featuredPublication+endHtml;
				}

				$("#publicationContent").append();
			});
		},function(err){
			console.error(err);
		});
	}
}