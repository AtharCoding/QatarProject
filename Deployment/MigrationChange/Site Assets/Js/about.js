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
	$.when(getData(_listTitleAboutUs),getData(_listTitleGuidingPrinciple),getData(_listTitleAboutExplore))
    .then(function(respAboutUs, respGuideLinePrinciple,respAboutExplore){
		try {
			getListDetails(_listTitleAboutUs,function(resultTitle,resultDesc){
				$("#contentListTitle").text(resultTitle);
				$("#contentListDesc").text(resultDesc);
			});

		} catch (error) {
			console.error(error);
		}
		
		var OverviewTitle = isArabic ? SlicingTitle(respAboutUs.getItemAtIndex(0).get_item("AboutArabicTitle")): SlicingTitle(respAboutUs.getItemAtIndex(0).get_item("Title"));
		let OverViewDesc = isArabic ? SlicingDesc(respAboutUs.getItemAtIndex(0).get_item("AboutArabicDesc")): SlicingDesc(respAboutUs.getItemAtIndex(0).get_item("AboutDesc"));
		var PhotoOverView=respAboutUs.getItemAtIndex(0).get_fieldValues()['ImageUrl']!=null? getImageSrcValue(respAboutUs.getItemAtIndex(0).get_fieldValues()['ImageUrl']):"";
	
		var MissionTitle = isArabic ? SlicingTitle(respAboutUs.getItemAtIndex(1).get_item("AboutArabicTitle")): SlicingTitle(respAboutUs.getItemAtIndex(1).get_item("Title"));
		var MissionDesc = isArabic ? SlicingDesc(respAboutUs.getItemAtIndex(1).get_item("AboutArabicDesc")): SlicingDesc(respAboutUs.getItemAtIndex(1).get_item("AboutDesc"));
	
		var VisionTitle = isArabic ? SlicingTitle(respAboutUs.getItemAtIndex(2).get_item("AboutArabicTitle")): SlicingTitle(respAboutUs.getItemAtIndex(2).get_item("Title"));
		var VisionDesc = isArabic ? SlicingDesc(respAboutUs.getItemAtIndex(2).get_item("AboutArabicDesc")): SlicingDesc(respAboutUs.getItemAtIndex(2).get_item("AboutDesc"));
	
		var generalResearchFrameworkTitle = isArabic ? SlicingTitle(respAboutUs.getItemAtIndex(3).get_item("AboutArabicTitle")): SlicingTitle(respAboutUs.getItemAtIndex(3).get_item("Title"));
		var generalResearchFrameworkDesc = isArabic ? SlicingDesc(respAboutUs.getItemAtIndex(3).get_item("AboutArabicDesc")): SlicingDesc(respAboutUs.getItemAtIndex(3).get_item("AboutDesc"));
		var PhotoGeneralURL=respAboutUs.getItemAtIndex(3).get_fieldValues()['ImageUrl']!=null? getImageSrcValue(respAboutUs.getItemAtIndex(3).get_fieldValues()['ImageUrl']):"";
		
		
		var GuidingPrincipleTitle = isArabic ? SlicingTitle(respAboutUs.getItemAtIndex(4).get_item("AboutArabicTitle")): SlicingTitle(respAboutUs.getItemAtIndex(4).get_item("Title"));
		var AboutExploreTitle = isArabic ? SlicingTitle(respAboutUs.getItemAtIndex(5).get_item("AboutArabicTitle")): SlicingTitle(respAboutUs.getItemAtIndex(5).get_item("Title"));
		

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
		for (var i = 0; i < respGuideLinePrinciple.get_count(); i++) {
			if(i==4){
				break;
			}
			
			let GuideLineLinkToPageURL=respGuideLinePrinciple.getItemAtIndex(i).get_item("GuideLineLinkToPage")!=null?respGuideLinePrinciple.getItemAtIndex(i).get_item("GuideLineLinkToPage").get_url():"";
			var GuidePhotoURL=respGuideLinePrinciple.getItemAtIndex(i).get_item("ImageUrl")!=null? getImageSrcValue(respGuideLinePrinciple.getItemAtIndex(i).get_item("ImageUrl")):"";
			let GuideLineTitle = isArabic ? SlicingTitle(respGuideLinePrinciple.getItemAtIndex(i).get_item("GuideLineArabicTitle")): SlicingTitle(respGuideLinePrinciple.getItemAtIndex(i).get_item("Title"));
			let GuideLineDesc = isArabic ? SlicingTitle(respGuideLinePrinciple.getItemAtIndex(i).get_item("GuideLineArabicDesc")): SlicingTitle(respGuideLinePrinciple.getItemAtIndex(i).get_item("GuideLineDesc"));
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
		for (var i = 0; i < respAboutExplore.get_count(); i++) {
			if(i==3){
				break;
			}
			var LinkToPageMoreURL = "";
			if(respAboutExplore.getItemAtIndex(i).get_item("AboutExploreArabicCLinkToPage")!=null){
				LinkToPageMoreURL=isArabic?respAboutExplore.getItemAtIndex(i).get_item("AboutExploreArabicCLinkToPage").get_url():respAboutExplore.getItemAtIndex(i).get_item("AboutExploreLinkToPage").get_url();
			}
			var AboutExplorePhoto=respAboutExplore.getItemAtIndex(i).get_item("ImageUrl")!=null? getImageSrcValue(respAboutExplore.getItemAtIndex(i).get_item("ImageUrl")):"";
			let AboutExploreTitle = isArabic ? SlicingTitle(respAboutExplore.getItemAtIndex(i).get_item("AboutExploreArabicTitle")): SlicingTitle(respAboutExplore.getItemAtIndex(i).get_item("Title"));
			
			aboutMoreSection+="<div class='col-lg-4'>";
			aboutMoreSection+="<div class='more-about'>";
			aboutMoreSection+="<a href="+LinkToPageMoreURL+" ><img src='"+AboutExplorePhoto+"' alt='...''><h4>"+AboutExploreTitle+"</h4></a>";
			aboutMoreSection+="</div></div>";
		}
		aboutMoreSection+="</div></div></section>";
		$("#aboutMoreSection").append(aboutMoreSection);
		
		
	})
	.fail(CommonUtil.OnRESTError);
	
	//For sharing site
	let metaTitle="About Us";
	let metaDesc="Motife About Us";
	let metaImageUrl=_spPageContextInfo.webLogoUrl;
	$("head").append("<meta property='og:title' content='"+metaTitle+"'>");
	$("head").append("<meta property='og:description' content='"+metaDesc+"'>");
	$("head").append("<meta property='og:image' content='"+metaImageUrl+"'>");
	$("head").append("<meta name='twitter:card' content='"+metaDesc+"'>");
}

function getData(listName) {
	var dfd = $.Deferred(function(){
	var context = new SP.ClientContext.get_current();
	var web = context.get_site().get_rootWeb();
	var ListName = web.get_lists().getByTitle(listName);
	var camlQuery = new SP.CamlQuery();
	camlQuery.set_viewXml(
		"<View><Query><OrderBy><FieldRef Name='ID' Ascending='True'/></OrderBy></Query></View>"
	);
	var ListNameItems = ListName.getItems(camlQuery);
	
	context.load(ListNameItems);
		context.executeQueryAsync(
			function(){
				dfd.resolve(ListNameItems);
			},
			function(sender,args){
				dfd.reject(args.get_message());
			}
		);
	});
	return dfd.promise();
}

