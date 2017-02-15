.rounded-corners (@radius: 5px) {
    -webkit-border-radius: @radius;
    -moz-border-radius: @radius;
    -ms-border-radius: @radius;
    -o-border-radius: @radius;
    border-radius: @radius;
}

@bg-color: #4A4E5A;

@container-size-1: 1560px;
@container-size-2: 1872px;

.container {
    width: 97.5%;
}

// .media-height- {
//     height:
// }


.header {
    height: 50px;
    .rounded-corners(2px);
    background: @bg-color;
    font-size: 30px;
    color: #ACADB2;
    line-height: 50px;
    text-align: center;
}
.footer {
    height: 35px;
    .rounded-corners(2px);
    background: @bg-color;
}

.filter-menu {
    margin-top: 10px;
    margin-bottom: 10px;
}

.btn-selection {
    color: #333;
    background-color: #fff;
    border-color: #ccc;
}

.vis-container {
    height: 100%;
    padding: 0;
}

.vis-retweetpath-container {
    .vis-container;
}

.vis-timeline-container {
    .vis-container;
}

.vis-mds-container {
    .vis-container;
}

.vis-basic (@height: 200px) {
    height: @height;
    background-color: white;
    border-style: solid;
    border-color: #4A4E5A;
    border-width: 2px;
}

.vis-main {
    .vis-basic(560px);
    @media only screen and (max-width: 1630px) {
        height: 450px;
    }
}
.vis-timeline {
    .vis-basic(200px);
    @media only screen and (max-width: 1630px) {
        height: 160px;
    }
}
.vis-ctrl {
    .vis-basic(200px);
    @media only screen and (max-width: 1630px) {
        height: 155px;
    }
}
.vis-info {
    .vis-basic(360px);
    overflow-y: auto;
    @media only screen and (max-width: 1630px) {
        height: 295px;
    }
}
.vis-mds {
    .vis-basic(200px);
    @media only screen and (max-width: 1630px) {
        height: 160px;
    }
}

.img-container {
    height: 760px;
    @media only screen and (max-width: 1630px) {
        height: 710px;
    }
}

.vis-main-overview {
    .vis-basic(760px);
    @media only screen and (max-width: 1630px) {
        height: 610px;
    }
}