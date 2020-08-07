"use strict";
var _siteUrl = "";
var _aboutUsListData=[];
var _aboutItemColl = [];
var _guideLineItemColl = [];
var _AboutExploreItemColl = [];
$(document).ready(function () {
	document.title = "About";
	_siteUrl = _spPageContextInfo.siteAbsoluteUrl;
	setInterval(function () {
		UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
	}, 20 * 60000);
	SP.SOD.executeFunc('sp.js', 'SP.ClientContext', aboutStart);
});

function aboutStart() {
	
	
	var urlForAboutUs =  _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleAboutUs + "')/items?" +
	"$select=ID,Title,AboutArabicTitle,AboutDesc,AboutArabicDesc,AboutPhoto" +
	"&$top=1000";
	var get_AboutUs = SPRestCommon.GetItemAjaxCall(urlForAboutUs);
	
	var urlGuideLinePrinciple = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleGuidingPrinciple + "')/items?" +
	"$select=ID,Title,GuideLineArabicTitle,GuideLineDesc,GuideLineArabicDesc,GuideLineLinkToPage,GuideLinePhoto" +
	"&$top=1000";
	var get_GuideLinePrinciple = SPRestCommon.GetItemAjaxCall(urlGuideLinePrinciple);

	var urlAboutExplore = _siteUrl + "/_api/web/lists/GetByTitle('" + _listTitleAboutExplore + "')/items?" +
	"$select=ID,Title,AboutExploreArabicTitle,AboutExplorePhoto,AboutExploreLinkToPage,AboutExploreArabicCLinkToPage" +
	"&$top=1000";
	var get_AboutExplore = SPRestCommon.GetItemAjaxCall(urlAboutExplore);
	
	
	$.when(get_AboutUs, get_GuideLinePrinciple,get_AboutExplore)
    .then(function(respAboutUs, respGuideLinePrinciple,respAboutExplore){
		try {
			getListDetails(_listTitleAboutUs,function(resultTitle,resultDesc){
				$("#contentListTitle").text(resultTitle);
				$("#contentListDesc").text(resultDesc);
			});
		} catch (error) {
			console.error(error);
		}

		
		_aboutItemColl = respAboutUs[0].d.results;
		_guideLineItemColl = respGuideLinePrinciple[0].d.results;
		_AboutExploreItemColl = respAboutExplore[0].d.results;

		
		let OverviewTitle = isArabic ? SlicingTitle(_aboutItemColl[0].AboutArabicTitle): SlicingTitle(_aboutItemColl[0].Title);
		let OverViewDesc = isArabic ? SlicingDesc(_aboutItemColl[0].AboutArabicDesc): SlicingDesc(_aboutItemColl[0].AboutDesc);

		let MissionTitle = isArabic ? SlicingTitle(_aboutItemColl[1].AboutArabicTitle): SlicingTitle(_aboutItemColl[1].Title);
		let MissionDesc = isArabic ? SlicingDesc(_aboutItemColl[1].AboutArabicDesc): SlicingDesc(_aboutItemColl[1].AboutDesc);

		let VisionTitle = isArabic ? SlicingTitle(_aboutItemColl[2].AboutArabicTitle): SlicingTitle(_aboutItemColl[2].Title);
		let VisionDesc = isArabic ? SlicingDesc(_aboutItemColl[2].AboutArabicDesc): SlicingDesc(_aboutItemColl[2].AboutDesc);

		let generalResearchFrameworkTitle = isArabic ? SlicingTitle(_aboutItemColl[3].AboutArabicTitle): SlicingTitle(_aboutItemColl[3].Title);
		let generalResearchFrameworkDesc = isArabic ? SlicingDesc(_aboutItemColl[3].AboutArabicDesc): SlicingDesc(_aboutItemColl[3].AboutDesc);

		let GuidingPrincipleTitle = isArabic ? SlicingTitle(_aboutItemColl[4].AboutArabicTitle): SlicingTitle(_aboutItemColl[4].Title);
		let AboutExploreTitle = isArabic ? SlicingTitle(_aboutItemColl[5].AboutArabicTitle): SlicingTitle(_aboutItemColl[5].Title);
		
		var aboutUpperSection = "";
		var PhotoOverView=_aboutItemColl[0].AboutPhoto!=null?_aboutItemColl[0].AboutPhoto.Url:"";
		var PhotoGeneralURL=_aboutItemColl[3].AboutPhoto!=null?_aboutItemColl[3].AboutPhoto.Url:"";

		$("#OverViewTitle").text(OverviewTitle);
		$("#OverViewDescription").text(OverViewDesc);
		$("#OverViewPhoto").attr("src",PhotoOverView);
		

		$("#OurMIssionTitle").text(MissionTitle);
		$("#OurMIssionDesc").text(MissionDesc);

		$("#OurVisionTitle").text(VisionTitle);
		$("#OurVisionDesc").text(VisionDesc);

	
		
		var aboutMidSection ="";
		aboutMidSection ="<section id='guiding-principles'>"+
							"<div class='container'>"+
							"<h2 class='section-title'>"+GuidingPrincipleTitle+"</h2>";
		aboutMidSection+= "<div class='row'>";												
		for (var i = 0; i < _guideLineItemColl.length; i++) {
			if(i==4){
				break;
			}
			
			let GuideLineLinkToPageURL=_guideLineItemColl[i].GuideLineLinkToPage!=null?_guideLineItemColl[i].GuideLineLinkToPage.Url:"";
			let GuidePhotoURL = _guideLineItemColl[i].GuideLinePhoto!=null?_guideLineItemColl[i].GuideLinePhoto.Url:"";
			let GuideLineTitle = isArabic ? SlicingTitle(_guideLineItemColl[i].GuideLineArabicTitle): SlicingTitle(_guideLineItemColl[i].Title);
			let GuideLineDesc = isArabic ? SlicingDesc(_guideLineItemColl[i].GuideLineArabicDesc): SlicingDesc(_guideLineItemColl[i].GuideLineDesc);
			aboutMidSection+="<div class='col-lg-3'>"+
										"<div class='card'>"+
											"<a href='"+GuideLineLinkToPageURL+"'>"+
												"<div class='card-img'>"+
													"<img src='"+GuidePhotoURL+"' alt='...'>"+
												"</div>"+
												"<div class='card-body'>"+
													"<h5 class='card-title'>"+GuideLineTitle+"</h5>"+
													"<p class='card-text'>"+GuideLineDesc+"</p>"+
												"</div>"+
											"</a>"+
										"</div>"+
							"</div>";
		}
		aboutMidSection+="</div></div></section>";
		$("#aboutMidSection").append(aboutMidSection);
		

		var aboutgeneralSection="";
		
		aboutgeneralSection = "<section id='general-research-framework'>"+
					"<div class='container'>"+
						"<div class='row'>"+
							"<div class='order-lg-2 col-lg-5'>"+
								"<h2 class='section-title d-lg-none'>"+generalResearchFrameworkTitle+"</h2>"+
								"<img src="+PhotoGeneralURL+" alt="+PhotoGeneralURL+">"+
							"</div>"+
							"<div class='order-lg-1 col-lg-7'>"+
								"<h2 class='section-title d-none d-lg-block'>"+generalResearchFrameworkTitle+"</h2>"+
								"<p>"+generalResearchFrameworkDesc+"</p>"+
								
							"</div>"+
						"</div>"+
					"</div>"+
				"</section>";	
		$("#aboutgeneralSection").append(aboutgeneralSection);	

		var aboutMoreSection ="";
		aboutMoreSection ="<section id='more-about'>"+
							"<div class='container'>"+
								"<div class='row'>"+
									"<div class='col-lg-6'>"+
										"<h2 class='section-title'>"+AboutExploreTitle+"</h2>"+
									"</div>"+
								"</div>";
		aboutMoreSection+= "<div class='row'>";					
		for (var i = 0; i < _AboutExploreItemColl.length; i++) {
			if(i==3){
				break;
			}
			let AboutExplorePhoto=_AboutExploreItemColl[i].AboutExplorePhoto!=null?_AboutExploreItemColl[i].AboutExplorePhoto.Url:"";
			let AboutExploreTitle = isArabic ? SlicingTitle(_AboutExploreItemColl[i].AboutExploreArabicTitle): SlicingTitle(_AboutExploreItemColl[i].Title);
			var LinkToPageMoreURL="";
			if(_AboutExploreItemColl[i].AboutExploreLinkToPage!=null){
				LinkToPageMoreURL = isArabic ? _AboutExploreItemColl[i].AboutExploreArabicCLinkToPage.Url: _AboutExploreItemColl[i].AboutExploreLinkToPage.Url;
			}
			aboutMoreSection+="<div class='col-lg-4'>";
			aboutMoreSection+="<div class='more-about'>";
			aboutMoreSection+="<a href="+LinkToPageMoreURL+" ><img src='"+AboutExplorePhoto+"' alt='...''><h4>"+AboutExploreTitle+"</h4></a>";
			aboutMoreSection+="</div></div>";
		}
		aboutMoreSection+="</div></div></section>";
		$("#aboutMoreSection").append(aboutMoreSection);
		
		
	})
    .fail(CommonUtil.OnRESTError);
}


