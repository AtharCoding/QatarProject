$(document).ready(function () {
    $("#search-button").click(function () {
        $(this).toggleClass("opend");

        $("#search-form").slideToggle();
        $("#search-button i").toggleClass("fal").toggleClass("fa-times");
        $("#search-button i").toggleClass("fas").toggleClass("fa-search");
    });
    $(".mobile-filter-button,.mobile-filter-back").click(function () {
        $("#filter").slideToggle();
        $(".overlay-bg").toggle();
    });
    $("#open-mobile-menu").click(function () {
        $(".mobile-menu").slideDown();
        $(".overlay-bg").show();
        
    });
    $("#mobile-menu-close").click(function () {
        $(".mobile-menu").slideUp();
        $(".overlay-bg").hide();
    });
    $(".slider-navigation h3").click(function () {
        $(".slider-navigation h3").removeClass("active");
        $(this).addClass("active");
    });
    $("#slider").on("slide.bs.carousel", function (e) {
        $(".slider-navigation h3").removeClass("active");
        $(".slider-navigation h3[data-slide-to='" + e.to + "']").addClass(
            "active"
        );
        console.log(e.to);
    });
    $(".selectpicker").selectpicker({
        style: "btn-primary",
        width: "100%",
    });
    // $(".select-event-status").selectpicker({
    //     style: "btn-light",
    //     width: "100%",
    // });
    $(".select-publucations-year").selectpicker({
        style: "btn-light",
        width: "100%",
    });
    $(".select-publucations-author").selectpicker({
        style: "btn-light",
        width: "100%",
    });
    $("#share-open").click(function () {
        $("#socail-share ul").slideToggle();
    });
    $(".filter-types button").click(function () {
        $(this).toggleClass("btn-light");
        $(this).toggleClass("btn-primary");
    });
    $(".filter-types button.all").click(function () {
        if ($(this).hasClass("btn-primary")) {
            $(".filter-types button").removeClass("btn-light");
            $(".filter-types button").addClass("btn-primary");
        }
    });
    $(".input-daterange input").each(function () {
        $(this).datepicker({
            format: "dd M yyyy",
        });
    });
});
$(document).mouseup(function (e) {
    var container = $("#search-form");
    // if the target of the click isn't the container nor a descendant of the container
    if (
        !$("#search-form").is(e.target) &&
        $("#search-form").has(e.target).length === 0 &&
        !$("#search-button").is(e.target) &&
        $("#search-button").has(e.target).length === 0
    ) {
        container.slideUp();
        $("#search-button i").removeClass("fal").removeClass("fa-times");
        $("#search-button i").addClass("fas").addClass("fa-search");
        $("#search-button").removeClass("opend");
    }
});
// $(".owl-carousel").owlCarousel({
//     loop: true,
//     margin: 30,
//     nav: true,
//     rtl: true,
//     navText: [
//         '<span class="nav-prev"><i class="fal fa-chevron-left"></i></span>',
//         '<span class="nav-next"><i class="fal fa-chevron-right"></i></span>',
//     ],
//     responsive: {
//         0: {
//             items: 1,
//             nav: false,
//         },
//         600: {
//             items: 3,
//         },
//         1000: {
//             items: 6,
//         },
//     },
// });
$(function () {
    $('[data-toggle="popover"]').popover({
        trigger: "focus",
    });
});
