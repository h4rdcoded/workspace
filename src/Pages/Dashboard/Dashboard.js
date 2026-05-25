import React, { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import ApexCharts from 'react-apexcharts';
import { NavLink } from 'react-router-dom';
const Dashboard = () => {
   const inputRef = useRef(null);
   
       useEffect(() => {
           if (inputRef.current) {
               flatpickr(inputRef.current, {
                   dateFormat: 'd M, Y',
                   defaultDate: 'today',
                   inline: true,
               });
           }
       }, []);
       const chartOptions = {
           chart: {
               type: 'bar',
               height: 350,
               toolbar: {
                   show: false
               },
               redrawOnParentResize: true,
               redrawOnWindowResize: true,
               sparkline: {
                   enabled: false
               }
           },
           colors: ['#687cfe', '#28c76f', '#ff9f43'],
           plotOptions: {
               bar: {
                   horizontal: false,
                   columnWidth: '50%',
                   endingShape: 'rounded',
                   borderRadius: 4,
                   dataLabels: {
                       position: 'top'
                   }
               },
           },
           dataLabels: {
               enabled: true,
               offsetY: -20,
               style: {
                   fontSize: '14px',
                   fontWeight: 'bold',
                   colors: ['#fff']
               },
               formatter: function (val) {
                   return val
               }
           },
           stroke: {
               show: true,
               width: 2,
               colors: ['transparent']
           },
           xaxis: {
               categories: ['Goal', 'Pending Forecast', 'Revenue'],
               labels: {
                   show: false
               },
               axisBorder: {
                   show: false
               },
               axisTicks: {
                   show: false
               }
           },
           yaxis: {
               show: true,
               labels: {
                   formatter: function (val) {
                       return '$' + val + 'k'
                   }
               }
           },
           fill: {
               opacity: 1
           },
           tooltip: {
               enabled: true,
               y: {
                   formatter: function (val) {
                       return "$" + val + "k"
                   }
               }
           },
           legend: {
               show: true,
               position: 'bottom',
               horizontalAlign: 'center',
               fontSize: '13px',
               markers: {
                   width: 10,
                   height: 10,
                   radius: 2
               }
           },
           grid: {
               show: true,
               borderColor: '#e0e6ed',
               strokeDashArray: 5,
               xaxis: {
                   lines: {
                       show: false
                   }
               },
               yaxis: {
                   lines: {
                       show: true
                   }
               }
           }
       };
       
       const chartSeries = [{
           name: 'Total Forecasted Value',
           data: [37, 12, 18]
       }];
       const chartOptionsLine = {
           chart: {
               type: 'radar',
               height: 350,
               toolbar: {
                   show: false
               },
               redrawOnParentResize: true,
               redrawOnWindowResize: true,
               dropShadow: {
                   enabled: true,
                   blur: 1,
                   left: 1,
                   top: 1
               }
           },
           series: [{
               name: 'Pending',
               data: [80, 50, 30, 40, 100, 20],
           }, {
               name: 'Loss',
               data: [20, 30, 40, 80, 20, 80],
           }, {
               name: 'Won',
               data: [44, 76, 78, 13, 43, 10],
           }],
           colors: ['#ff9f43', '#00d4aa', '#28c76f'],
           stroke: {
               width: 2
           },
           fill: {
               opacity: 0.2
           },
           markers: {
               size: 4
           },
           xaxis: {
               categories: ['2016', '2017', '2018', '2019', '2020', '2021']
           },
           legend: {
               show: true,
               position: 'bottom',
               horizontalAlign: 'center',
               fontSize: '13px',
               markers: {
                   width: 10,
                   height: 10,
                   radius: 50
               }
           }
       };
   
       const balanceOverviewChart = {
           chart: {
               height: 300,
               type: 'area',
               toolbar: {
                   show: false
               },
               redrawOnParentResize: true,
               redrawOnWindowResize: true,
               animations: {
                   enabled: true,
                   easing: 'easeinout',
                   speed: 800,
               }
           },
           responsive: [{
               breakpoint: 1200,
               options: {
                   chart: {
                       height: 250
                   }
               }
           }],
           dataLabels: {
               enabled: false
           },
           stroke: {
               curve: 'smooth',
               width: 3
           },
           series: [{
               name: 'Revenue',
               data: [31, 40, 28, 51, 42, 109, 100, 120, 140, 158, 165, 180]
           }, {
               name: 'Expenses',
               data: [11, 32, 45, 32, 34, 52, 41, 70, 88, 95, 102, 115]
           }],
           fill: {
               type: 'gradient',
               gradient: {
                   shadeIntensity: 1,
                   inverseColors: false,
                   opacityFrom: 0.45,
                   opacityTo: 0.05,
                   stops: [20, 100, 100, 100]
               },
           },
           xaxis: {
               categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
           },
           colors: ['#28c76f', '#ea5455'],
           markers: {
               size: 0,
               hover: {
                   sizeOffset: 6
               }
           },
           tooltip: {
               y: [{
                   title: {
                       formatter: function (val) {
                           return val + " (thousands)"
                       }
                   }
               }, {
                   title: {
                       formatter: function (val) {
                           return val + " (thousands)"
                       }
                   }
               }]
           }
       };


    return (
            <div>
        <div>
           
          {/* Begin page */}
          <div id="layout-wrapper">
           
            {/* removeNotificationModal */}
            <div id="removeNotificationModal" className="modal fade zoomIn" tabIndex={-1} aria-hidden="true">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" id="NotificationModalbtn-close" />
                  </div>
                  <div className="modal-body">
                    <div className="mt-2 text-center">
                      <lord-icon src="https://cdn.lordicon.com/gsqxdxog.json" trigger="loop" colors="primary:#f7b84b,secondary:#f06548" style={{width: 100, height: 100}} />
                      <div className="mt-4 pt-2 fs-15 mx-4 mx-sm-5">
                        <h4>Are you sure ?</h4>
                        <p className="text-muted mx-4 mb-0">Are you sure you want to remove this Notification ?</p>
                      </div>
                    </div>
                    <div className="d-flex gap-2 justify-content-center mt-4 mb-2">
                      <button type="button" className="btn w-sm btn-light" data-bs-dismiss="modal">Close</button>
                      <button type="button" className="btn w-sm btn-danger" id="delete-notification">Yes, Delete It!</button>
                    </div>
                  </div>
                </div>{/* /.modal-content */}
              </div>{/* /.modal-dialog */}
            </div>{/* /.modal */}
            {/* ========== App Menu ========== */}
            <div className="app-menu navbar-menu">
              {/* LOGO */}
              <div className="navbar-brand-box">
                {/* Dark Logo*/}
                <a href="index.html" className="logo logo-dark">
                  <span className="logo-sm">
                    <img src="assets/images/logo-sm.png" alt height={22} />
                  </span>
                  <span className="logo-lg">
                    <img src="assets/images/logo-dark.png" alt height={17} />
                  </span>
                </a>
                {/* Light Logo*/}
                <a href="index.html" className="logo logo-light">
                  <span className="logo-sm">
                    <img src="assets/images/logo-sm.png" alt height={22} />
                  </span>
                  <span className="logo-lg">
                    <img src="assets/images/logo-light.png" alt height={17} />
                  </span>
                </a>
                <button type="button" className="btn btn-sm p-0 fs-20 header-item float-end btn-vertical-sm-hover" id="vertical-hover">
                  <i className="ri-record-circle-line" />
                </button>
              </div>
              
              <div className="sidebar-background" />
            </div>
            {/* Left Sidebar End */}
            {/* Vertical Overlay*/}
            <div className="vertical-overlay" />
            {/* ============================================================== */}
            {/* Start right Content here */}
            {/* ============================================================== */}
            <div className="main-content">
              <div className="page-content">
                <div className="container-fluid">
                  {/* start page title */}
                  <div className="row">
                    <div className="col-12">
                      <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0">Control Panel</h4>
                        <div className="page-title-right">
                          <ol className="breadcrumb m-0">
                            <li className="breadcrumb-item"><a href="javascript: void(0);">Dashboards</a></li>
                            <li className="breadcrumb-item active">Control Panel</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end page title */}
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="card crm-widget">
                        <div className="card-body p-0">
                          <div className="row row-cols-xxl-5 row-cols-md-3 row-cols-1 g-0">
                            <div className="col">
                              <div className="py-4 px-3">
                                <h5 className="text-muted text-uppercase fs-13 mb-3">Campaign Sent <i className="ri-arrow-up-circle-line text-success fs-18 float-end align-middle" /></h5>
                                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0">
                                    <i className="las la-rocket fs-3 text-muted" />
                                  </div>
                                  <div className="flex-grow-1 ms-3">
                                    <h4 className="mb-0"><span className="counter-value" data-target={197}>0</span></h4>
                                  </div>
                                </div>
                              </div>
                            </div>{/* end col */}
                            <div className="col">
                              <div className="mt-3 mt-md-0 py-4 px-3">
                                <h5 className="text-muted text-uppercase fs-13 mb-3">Annual Profit <i className="ri-arrow-up-circle-line text-success fs-18 float-end align-middle" /></h5>
                                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0">
                                    <i className="ri-exchange-dollar-line fs-3 text-muted" />
                                  </div>
                                  <div className="flex-grow-1 ms-3">
                                    <h4 className="mb-0">$<span className="counter-value" data-target="489.4">0</span>k</h4>
                                  </div>
                                </div>
                              </div>
                            </div>{/* end col */}
                            <div className="col">
                              <div className="mt-3 mt-md-0 py-4 px-3">
                                <h5 className="text-muted text-uppercase fs-13 mb-3">Lead Conversation <i className="ri-arrow-down-circle-line text-danger fs-18 float-end align-middle" /></h5>
                                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0">
                                    <i className="ri-pulse-line fs-3 text-muted" />
                                  </div>
                                  <div className="flex-grow-1 ms-3">
                                    <h4 className="mb-0"><span className="counter-value" data-target="32.89">0</span>%</h4>
                                  </div>
                                </div>
                              </div>
                            </div>{/* end col */}
                            <div className="col">
                              <div className="mt-3 mt-lg-0 py-4 px-3">
                                <h5 className="text-muted text-uppercase fs-13 mb-3">Daily Average Income <i className="ri-arrow-up-circle-line text-success fs-18 float-end align-middle" /></h5>
                                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0">
                                    <i className="las la-trophy fs-3 text-muted" />
                                  </div>
                                  <div className="flex-grow-1 ms-3">
                                    <h4 className="mb-0">$<span className="counter-value" data-target="1596.5">0</span></h4>
                                  </div>
                                </div>
                              </div>
                            </div>{/* end col */}
                            <div className="col">
                              <div className="mt-3 mt-lg-0 py-4 px-3">
                                <h5 className="text-muted text-uppercase fs-13 mb-3">Annual Deals <i className="ri-arrow-down-circle-line text-danger fs-18 float-end align-middle" /></h5>
                                <div className="d-flex align-items-center">
                                  <div className="flex-shrink-0">
                                    <i className="las la-handshake fs-3 text-muted" />
                                  </div>
                                  <div className="flex-grow-1 ms-3">
                                    <h4 className="mb-0"><span className="counter-value" data-target={2659}>0</span></h4>
                                  </div>
                                </div>
                              </div>
                            </div>{/* end col */}
                          </div>{/* end row */}
                        </div>{/* end card body */}
                      </div>{/* end card */}
                    </div>{/* end col */}
                  </div>{/* end row */}
                  <div className="row">
                    <div className="col-xxl-3 col-md-6">
                      <div className="card card-height-100">
                        <div className="card-header align-items-center d-flex">
                          <h4 className="card-title mb-0 flex-grow-1">Sales Forecast</h4>
                          <div className="flex-shrink-0">
                            <div className="dropdown card-header-dropdown">
                              <a className="text-reset dropdown-btn" href="#" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span className="fw-semibold text-uppercase fs-12">Sort by: </span><span className="text-muted">Nov 2021<i className="mdi mdi-chevron-down ms-1" /></span>
                              </a>
                              <div className="dropdown-menu dropdown-menu-end">
                                <a className="dropdown-item" href="#">Oct 2021</a>
                                <a className="dropdown-item" href="#">Nov 2021</a>
                                <a className="dropdown-item" href="#">Dec 2021</a>
                                <a className="dropdown-item" href="#">Jan 2022</a>
                              </div>
                            </div>
                          </div>
                        </div>{/* end card header */}
                        <div className="card-body pb-0">
                          <ApexCharts 
                            options={chartOptions} 
                            series={chartSeries} 
                            type={chartOptions.chart.type} 
                            height={350}
                            width="100%"
                          />
                        </div>
                      </div>{/* end card */}
                    </div>{/* end col */}
                    <div className="col-xxl-3 col-md-6">
                      <div className="card card-height-100">
                        <div className="card-header align-items-center d-flex">
                          <h4 className="card-title mb-0 flex-grow-1">Deal Type</h4>
                          <div className="flex-shrink-0">
                            <div className="dropdown card-header-dropdown">
                              <a className="text-reset dropdown-btn" href="#" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span className="fw-semibold text-uppercase fs-12">Sort by: </span><span className="text-muted">Monthly<i className="mdi mdi-chevron-down ms-1" /></span>
                              </a>
                              <div className="dropdown-menu dropdown-menu-end">
                                <a className="dropdown-item" href="#">Today</a>
                                <a className="dropdown-item" href="#">Weekly</a>
                                <a className="dropdown-item" href="#">Monthly</a>
                                <a className="dropdown-item" href="#">Yearly</a>
                              </div>
                            </div>
                          </div>
                        </div>{/* end card header */}
                        <div className="card-body pb-0">
                          <ApexCharts 
                            options={chartOptionsLine} 
                            series={chartOptionsLine.series} 
                            type={chartOptionsLine.chart.type} 
                            height={350}
                            width="100%"
                          />
                        </div>{/* end card body */}
                      </div>{/* end card */}
                    </div>{/* end col */}
                    <div className="col-xxl-6">
                      <div className="card card-height-100">
                        <div className="card-header align-items-center d-flex">
                          <h4 className="card-title mb-0 flex-grow-1">Balance Overview</h4>
                          <div className="flex-shrink-0">
                            <div className="dropdown card-header-dropdown">
                              <a className="text-reset dropdown-btn" href="#" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span className="fw-semibold text-uppercase fs-12">Sort by: </span><span className="text-muted">Current Year<i className="mdi mdi-chevron-down ms-1" /></span>
                              </a>
                              <div className="dropdown-menu dropdown-menu-end">
                                <a className="dropdown-item" href="#">Today</a>
                                <a className="dropdown-item" href="#">Last Week</a>
                                <a className="dropdown-item" href="#">Last Month</a>
                                <a className="dropdown-item" href="#">Current Year</a>
                              </div>
                            </div>
                          </div>
                        </div>{/* end card header */}
                        <div className="card-body px-0">
                          <ul className="list-inline main-chart text-center mb-0">
                            <li className="list-inline-item chart-border-left me-0 border-0">
                              <h5 className="text-primary">$584k <span className="text-muted d-inline-block fs-13 align-middle ms-2">Revenue</span></h5>
                            </li>
                            <li className="list-inline-item chart-border-left me-0">
                              <h5>$497k<span className="text-muted d-inline-block fs-13 align-middle ms-2">Expenses</span></h5>
                            </li>
                            <li className="list-inline-item chart-border-left me-0">
                              <h5><span data-plugin="counterup">3.6</span>%<span className="text-muted d-inline-block fs-13 align-middle ms-2">Profit Ratio</span></h5>
                            </li>
                          </ul>
                          <ApexCharts 
                            options={balanceOverviewChart} 
                            series={balanceOverviewChart.series} 
                            type={balanceOverviewChart.chart.type} 
                            height={300}
                            width="100%"
                          />
                        </div>
                      </div>{/* end card */}
                    </div>{/* end col */}
                  </div>{/* end row */}
                  <div className="row">
                    <div className="col-xl-7">
                      <div className="card">
                        <div className="card-header align-items-center d-flex">
                          <h4 className="card-title mb-0 flex-grow-1">Deals Status</h4>
                          <div className="flex-shrink-0">
                            <div className="dropdown card-header-dropdown">
                              <a className="text-reset dropdown-btn" href="#" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span className="text-muted">02 Nov 2021 to 31 Dec 2021<i className="mdi mdi-chevron-down ms-1" /></span>
                              </a>
                              <div className="dropdown-menu dropdown-menu-end">
                                <a className="dropdown-item" href="#">Today</a>
                                <a className="dropdown-item" href="#">Last Week</a>
                                <a className="dropdown-item" href="#">Last Month</a>
                                <a className="dropdown-item" href="#">Current Year</a>
                              </div>
                            </div>
                          </div>
                        </div>{/* end card header */}
                        <div className="card-body">
                          <div className="table-responsive table-card">
                            <table className="table table-borderless table-hover table-nowrap align-middle mb-0">
                              <thead className="table-light">
                                <tr className="text-muted">
                                  <th scope="col">Name</th>
                                  <th scope="col" style={{width: '20%'}}>Last Contacted</th>
                                  <th scope="col">Sales Representative</th>
                                  <th scope="col" style={{width: '16%'}}>Status</th>
                                  <th scope="col" style={{width: '12%'}}>Deal Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>Absternet LLC</td>
                                  <td>Sep 20, 2021</td>
                                  <td><img src="assets/images/users/avatar-1.jpg" alt className="avatar-xs rounded-circle me-2" />
                                    <a href="#javascript: void(0);" className="text-body fw-medium">Donald Risher</a>
                                  </td>
                                  <td><span className="badge bg-success-subtle text-success p-2">Deal Won</span></td>
                                  <td>
                                    <div className="text-nowrap">$100.1K</div>
                                  </td>
                                </tr>
                                <tr>
                                  <td>Raitech Soft</td>
                                  <td>Sep 23, 2021</td>
                                  <td><img src="assets/images/users/avatar-2.jpg" alt className="avatar-xs rounded-circle me-2" />
                                    <a href="#javascript: void(0);" className="text-body fw-medium">Sofia Cunha</a>
                                  </td>
                                  <td><span className="badge bg-warning-subtle text-warning p-2">Intro Call</span></td>
                                  <td>
                                    <div className="text-nowrap">$150K</div>
                                  </td>
                                </tr>
                                <tr>
                                  <td>William PVT</td>
                                  <td>Sep 27, 2021</td>
                                  <td><img src="assets/images/users/avatar-3.jpg" alt className="avatar-xs rounded-circle me-2" />
                                    <a href="#javascript: void(0);" className="text-body fw-medium">Luis Rocha</a>
                                  </td>
                                  <td><span className="badge bg-danger-subtle text-danger p-2">Stuck</span></td>
                                  <td>
                                    <div className="text-nowrap">$78.18K</div>
                                  </td>
                                </tr>
                                <tr>
                                  <td>Loiusee LLP</td>
                                  <td>Sep 30, 2021</td>
                                  <td><img src="assets/images/users/avatar-4.jpg" alt className="avatar-xs rounded-circle me-2" />
                                    <a href="#javascript: void(0);" className="text-body fw-medium">Vitoria Rodrigues</a>
                                  </td>
                                  <td><span className="badge bg-success-subtle text-success p-2">Deal Won</span></td>
                                  <td>
                                    <div className="text-nowrap">$180K</div>
                                  </td>
                                </tr>
                                <tr>
                                  <td>Apple Inc.</td>
                                  <td>Sep 30, 2021</td>
                                  <td><img src="assets/images/users/avatar-6.jpg" alt className="avatar-xs rounded-circle me-2" />
                                    <a href="#javascript: void(0);" className="text-body fw-medium">Vitoria Rodrigues</a>
                                  </td>
                                  <td><span className="badge bg-info-subtle text-info p-2">New Lead</span></td>
                                  <td>
                                    <div className="text-nowrap">$78.9K</div>
                                  </td>
                                </tr>
                              </tbody>{/* end tbody */}
                            </table>{/* end table */}
                          </div>{/* end table responsive */}
                        </div>{/* end card body */}
                      </div>{/* end card */}
                    </div>{/* end col */}
                    <div className="col-xl-5">
                      <div className="card card-height-100">
                        <div className="card-header align-items-center d-flex">
                          <h4 className="card-title mb-0 flex-grow-1">My Tasks</h4>
                          <div className="flex-shrink-0">
                            <div className="dropdown card-header-dropdown">
                              <a className="text-reset dropdown-btn" href="#" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span className="text-muted"><i className="ri-settings-4-line align-middle me-1 fs-15" />Settings</span>
                              </a>
                              <div className="dropdown-menu dropdown-menu-end">
                                <a className="dropdown-item" href="#">Edit</a>
                                <a className="dropdown-item" href="#">Remove</a>
                              </div>
                            </div>
                          </div>
                        </div>{/* end card header */}
                        <div className="card-body p-0">
                          <div className="align-items-center p-3 justify-content-between d-flex">
                            <div className="flex-shrink-0">
                              <div className="text-muted"><span className="fw-semibold">4</span> of <span className="fw-semibold">10</span> remaining</div>
                            </div>
                            <button type="button" className="btn btn-sm btn-primary"><i className="ri-add-line align-middle me-1" /> Add Task</button>
                          </div>{/* end card header */}
                          <div data-simplebar style={{maxHeight: 219}}>
                            <ul className="list-group list-group-flush border-dashed px-3">
                              <li className="list-group-item ps-0">
                                <div className="d-flex align-items-start">
                                  <div className="form-check ps-0 flex-sharink-0">
                                    <input type="checkbox" className="form-check-input ms-0" id="task_one" />
                                  </div>
                                  <div className="flex-grow-1">
                                    <label className="form-check-label mb-0 ps-2" htmlFor="task_one">Review and make sure nothing slips through cracks</label>
                                  </div>
                                  <div className="flex-shrink-0 ms-2">
                                    <p className="text-muted fs-12 mb-0">15 Sep, 2021</p>
                                  </div>
                                </div>
                              </li>
                              <li className="list-group-item ps-0">
                                <div className="d-flex align-items-start">
                                  <div className="form-check ps-0 flex-sharink-0">
                                    <input type="checkbox" className="form-check-input ms-0" id="task_two" />
                                  </div>
                                  <div className="flex-grow-1">
                                    <label className="form-check-label mb-0 ps-2" htmlFor="task_two">Send meeting invites for sales upcampaign</label>
                                  </div>
                                  <div className="flex-shrink-0 ms-2">
                                    <p className="text-muted fs-12 mb-0">20 Sep, 2021</p>
                                  </div>
                                </div>
                              </li>
                              <li className="list-group-item ps-0">
                                <div className="d-flex align-items-start">
                                  <div className="form-check flex-sharink-0 ps-0">
                                    <input type="checkbox" className="form-check-input ms-0" id="task_three" />
                                  </div>
                                  <div className="flex-grow-1">
                                    <label className="form-check-label mb-0 ps-2" htmlFor="task_three">Weekly closed sales won checking with sales team</label>
                                  </div>
                                  <div className="flex-shrink-0 ms-2">
                                    <p className="text-muted fs-12 mb-0">24 Sep, 2021</p>
                                  </div>
                                </div>
                              </li>
                              <li className="list-group-item ps-0">
                                <div className="d-flex align-items-start">
                                  <div className="form-check ps-0 flex-sharink-0">
                                    <input type="checkbox" className="form-check-input ms-0" id="task_four" />
                                  </div>
                                  <div className="flex-grow-1">
                                    <label className="form-check-label mb-0 ps-2" htmlFor="task_four">Add notes that can be viewed from the individual view</label>
                                  </div>
                                  <div className="flex-shrink-0 ms-2">
                                    <p className="text-muted fs-12 mb-0">27 Sep, 2021</p>
                                  </div>
                                </div>
                              </li>
                              <li className="list-group-item ps-0">
                                <div className="d-flex align-items-start">
                                  <div className="form-check ps-0 flex-sharink-0">
                                    <input type="checkbox" className="form-check-input ms-0" id="task_five" />
                                  </div>
                                  <div className="flex-grow-1">
                                    <label className="form-check-label mb-0 ps-2" htmlFor="task_five">Move stuff to another page</label>
                                  </div>
                                  <div className="flex-shrink-0 ms-2">
                                    <p className="text-muted fs-12 mb-0">27 Sep, 2021</p>
                                  </div>
                                </div>
                              </li>
                              <li className="list-group-item ps-0">
                                <div className="d-flex align-items-start">
                                  <div className="form-check ps-0 flex-sharink-0">
                                    <input type="checkbox" className="form-check-input ms-0" id="task_six" />
                                  </div>
                                  <div className="flex-grow-1">
                                    <label className="form-check-label mb-0 ps-2" htmlFor="task_six">Styling wireframe design and documentation for velzon admin</label>
                                  </div>
                                  <div className="flex-shrink-0 ms-2">
                                    <p className="text-muted fs-12 mb-0">27 Sep, 2021</p>
                                  </div>
                                </div>
                              </li>
                            </ul>{/* end ul */}
                          </div>
                          <div className="p-3 pt-2">
                            <a href="javascript:void(0);" className="text-muted text-decoration-underline">Show more...</a>
                          </div>
                        </div>{/* end card body */}
                      </div>{/* end card */}
                    </div>{/* end col */}
                  </div>{/* end row */}
                  <div className="row">
                    <div className="col-xxl-5">
                      <div className="card">
                        <div className="card-header align-items-center d-flex">
                          <h4 className="card-title mb-0 flex-grow-1">Upcoming Activities</h4>
                          <div className="flex-shrink-0">
                            <div className="dropdown card-header-dropdown">
                              <a className="text-reset dropdown-btn" href="#" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span className="text-muted fs-18"><i className="mdi mdi-dots-vertical" /></span>
                              </a>
                              <div className="dropdown-menu dropdown-menu-end">
                                <a className="dropdown-item" href="#">Edit</a>
                                <a className="dropdown-item" href="#">Remove</a>
                              </div>
                            </div>
                          </div>
                        </div>{/* end card header */}
                        <div className="card-body pt-0">
                          <ul className="list-group list-group-flush border-dashed">
                            <li className="list-group-item ps-0">
                              <div className="row align-items-center g-3">
                                <div className="col-auto">
                                  <div className="avatar-sm p-1 py-2 h-auto bg-light rounded-3">
                                    <div className="text-center">
                                      <h5 className="mb-0">25</h5>
                                      <div className="text-muted">Tue</div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col">
                                  <h5 className="text-muted mt-0 mb-1 fs-13">12:00am - 03:30pm</h5>
                                  <a href="#" className="text-reset fs-14 mb-0">Meeting for campaign with sales team</a>
                                </div>
                                <div className="col-sm-auto">
                                  <div className="avatar-group">
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);" className="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title data-bs-original-title="Stine Nielsen">
                                        <img src="assets/images/users/avatar-1.jpg" alt className="rounded-circle avatar-xxs" />
                                      </a>
                                    </div>
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);" className="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title data-bs-original-title="Jansh Brown">
                                        <img src="assets/images/users/avatar-2.jpg" alt className="rounded-circle avatar-xxs" />
                                      </a>
                                    </div>
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);" className="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title data-bs-original-title="Dan Gibson">
                                        <img src="assets/images/users/avatar-3.jpg" alt className="rounded-circle avatar-xxs" />
                                      </a>
                                    </div>
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);">
                                        <div className="avatar-xxs">
                                          <span className="avatar-title rounded-circle bg-info text-white">
                                            5
                                          </span>
                                        </div>
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* end row */}
                            </li>{/* end */}
                            <li className="list-group-item ps-0">
                              <div className="row align-items-center g-3">
                                <div className="col-auto">
                                  <div className="avatar-sm p-1 py-2 h-auto bg-light rounded-3">
                                    <div className="text-center">
                                      <h5 className="mb-0">20</h5>
                                      <div className="text-muted">Wed</div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col">
                                  <h5 className="text-muted mt-0 mb-1 fs-13">02:00pm - 03:45pm</h5>
                                  <a href="#" className="text-reset fs-14 mb-0">Adding a new event with attachments</a>
                                </div>
                                <div className="col-sm-auto">
                                  <div className="avatar-group">
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);" className="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title data-bs-original-title="Frida Bang">
                                        <img src="assets/images/users/avatar-4.jpg" alt className="rounded-circle avatar-xxs" />
                                      </a>
                                    </div>
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);" className="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title data-bs-original-title="Malou Silva">
                                        <img src="assets/images/users/avatar-5.jpg" alt className="rounded-circle avatar-xxs" />
                                      </a>
                                    </div>
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);" className="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title data-bs-original-title="Simon Schmidt">
                                        <img src="assets/images/users/avatar-6.jpg" alt className="rounded-circle avatar-xxs" />
                                      </a>
                                    </div>
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);" className="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title data-bs-original-title="Tosh Jessen">
                                        <img src="assets/images/users/avatar-7.jpg" alt className="rounded-circle avatar-xxs" />
                                      </a>
                                    </div>
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);">
                                        <div className="avatar-xxs">
                                          <span className="avatar-title rounded-circle bg-success text-white">
                                            3
                                          </span>
                                        </div>
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* end row */}
                            </li>{/* end */}
                            <li className="list-group-item ps-0">
                              <div className="row align-items-center g-3">
                                <div className="col-auto">
                                  <div className="avatar-sm p-1 py-2 h-auto bg-light rounded-3">
                                    <div className="text-center">
                                      <h5 className="mb-0">17</h5>
                                      <div className="text-muted">Wed</div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col">
                                  <h5 className="text-muted mt-0 mb-1 fs-13">04:30pm - 07:15pm</h5>
                                  <a href="#" className="text-reset fs-14 mb-0">Create new project Bundling Product</a>
                                </div>
                                <div className="col-sm-auto">
                                  <div className="avatar-group">
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);" className="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title data-bs-original-title="Nina Schmidt">
                                        <img src="assets/images/users/avatar-8.jpg" alt className="rounded-circle avatar-xxs" />
                                      </a>
                                    </div>
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);" className="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title data-bs-original-title="Stine Nielsen">
                                        <img src="assets/images/users/avatar-1.jpg" alt className="rounded-circle avatar-xxs" />
                                      </a>
                                    </div>
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);" className="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title data-bs-original-title="Jansh Brown">
                                        <img src="assets/images/users/avatar-2.jpg" alt className="rounded-circle avatar-xxs" />
                                      </a>
                                    </div>
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);">
                                        <div className="avatar-xxs">
                                          <span className="avatar-title rounded-circle bg-primary text-white">
                                            4
                                          </span>
                                        </div>
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* end row */}
                            </li>{/* end */}
                            <li className="list-group-item ps-0">
                              <div className="row align-items-center g-3">
                                <div className="col-auto">
                                  <div className="avatar-sm p-1 py-2 h-auto bg-light rounded-3">
                                    <div className="text-center">
                                      <h5 className="mb-0">12</h5>
                                      <div className="text-muted">Tue</div>
                                    </div>
                                  </div>
                                </div>
                                <div className="col">
                                  <h5 className="text-muted mt-0 mb-1 fs-13">10:30am - 01:15pm</h5>
                                  <a href="#" className="text-reset fs-14 mb-0">Weekly closed sales won checking with sales team</a>
                                </div>
                                <div className="col-sm-auto">
                                  <div className="avatar-group">
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);" className="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title data-bs-original-title="Stine Nielsen">
                                        <img src="assets/images/users/avatar-1.jpg" alt className="rounded-circle avatar-xxs" />
                                      </a>
                                    </div>
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);" className="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title data-bs-original-title="Jansh Brown">
                                        <img src="assets/images/users/avatar-5.jpg" alt className="rounded-circle avatar-xxs" />
                                      </a>
                                    </div>
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);" className="d-inline-block" data-bs-toggle="tooltip" data-bs-placement="top" title data-bs-original-title="Dan Gibson">
                                        <img src="assets/images/users/avatar-2.jpg" alt className="rounded-circle avatar-xxs" />
                                      </a>
                                    </div>
                                    <div className="avatar-group-item">
                                      <a href="javascript: void(0);">
                                        <div className="avatar-xxs">
                                          <span className="avatar-title rounded-circle bg-warning text-white">
                                            9
                                          </span>
                                        </div>
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* end row */}
                            </li>{/* end */}
                          </ul>{/* end */}
                          <div className="align-items-center mt-2 row g-3 text-center text-sm-start">
                            <div className="col-sm">
                              <div className="text-muted">Showing<span className="fw-semibold">4</span> of <span className="fw-semibold">125</span> Results
                              </div>
                            </div>
                            <div className="col-sm-auto">
                              <ul className="pagination pagination-separated pagination-sm justify-content-center justify-content-sm-start mb-0">
                                <li className="page-item disabled">
                                  <a href="#" className="page-link">←</a>
                                </li>
                                <li className="page-item">
                                  <a href="#" className="page-link">1</a>
                                </li>
                                <li className="page-item active">
                                  <a href="#" className="page-link">2</a>
                                </li>
                                <li className="page-item">
                                  <a href="#" className="page-link">3</a>
                                </li>
                                <li className="page-item">
                                  <a href="#" className="page-link">→</a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>{/* end card body */}
                      </div>{/* end card */}
                    </div>{/* end col */}
                    <div className="col-xxl-7">
                      <div className="card card-height-100">
                        <div className="card-header align-items-center d-flex">
                          <h4 className="card-title mb-0 flex-grow-1">Closing Deals</h4>
                          <div className="flex-shrink-0">
                            <select className="form-select form-select-sm" aria-label=".form-select-sm example">
                              <option selected>Closed Deals</option>
                              <option value={1}>Active Deals</option>
                              <option value={2}>Paused Deals</option>
                              <option value={3}>Canceled Deals</option>
                            </select>
                          </div>
                        </div>{/* end card header */}
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table table-bordered table-nowrap align-middle mb-0">
                              <thead>
                                <tr>
                                  <th scope="col" style={{width: '30%'}}>Deal Name</th>
                                  <th scope="col" style={{width: '30%'}}>Sales Rep</th>
                                  <th scope="col" style={{width: '20%'}}>Amount</th>
                                  <th scope="col" style={{width: '20%'}}>Close Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>Acme Inc Install</td>
                                  <td><img src="assets/images/users/avatar-1.jpg" alt className="avatar-xs rounded-circle me-2" />
                                    <a href="#javascript: void(0);" className="text-body fw-medium">Donald Risher</a>
                                  </td>
                                  <td>$96k</td>
                                  <td>Today</td>
                                </tr>
                                <tr>
                                  <td>Save lots Stores</td>
                                  <td><img src="assets/images/users/avatar-2.jpg" alt className="avatar-xs rounded-circle me-2" />
                                    <a href="#javascript: void(0);" className="text-body fw-medium">Jansh Brown</a>
                                  </td>
                                  <td>$55.7k</td>
                                  <td>30 Dec 2021</td>
                                </tr>
                                <tr>
                                  <td>William PVT</td>
                                  <td><img src="assets/images/users/avatar-7.jpg" alt className="avatar-xs rounded-circle me-2" />
                                    <a href="#javascript: void(0);" className="text-body fw-medium">Ayaan Hudda</a>
                                  </td>
                                  <td>$102k</td>
                                  <td>25 Nov 2021</td>
                                </tr>
                                <tr>
                                  <td>Raitech Soft</td>
                                  <td><img src="assets/images/users/avatar-4.jpg" alt className="avatar-xs rounded-circle me-2" />
                                    <a href="#javascript: void(0);" className="text-body fw-medium">Julia William</a>
                                  </td>
                                  <td>$89.5k</td>
                                  <td>20 Sep 2021</td>
                                </tr>
                                <tr>
                                  <td>Absternet LLC</td>
                                  <td><img src="assets/images/users/avatar-4.jpg" alt className="avatar-xs rounded-circle me-2" />
                                    <a href="#javascript: void(0);" className="text-body fw-medium">Vitoria Rodrigues</a>
                                  </td>
                                  <td>$89.5k</td>
                                  <td>20 Sep 2021</td>
                                </tr>
                              </tbody>{/* end tbody */}
                            </table>{/* end table */}
                          </div>{/* end table responsive */}
                        </div>{/* end card body */}
                      </div>{/* end card */}
                    </div>{/* end col */}
                  </div>{/* end row */}
                </div>
                {/* container-fluid */}
              </div>
              {/* End Page-content */}
              <footer className="footer">
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-sm-6">
                      © Ipshopy.
                    </div>
                    <div className="col-sm-6">
                      <div className="text-sm-end d-none d-sm-block">
                        Design &amp; Develop by Ipshopy
                      </div>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
            {/* end main content*/}
          </div>
          {/* END layout-wrapper */}
          {/*start back-to-top*/}
          <button onclick="topFunction()" className="btn btn-danger btn-icon" id="back-to-top">
            <i className="ri-arrow-up-line" />
          </button>
          {/*end back-to-top*/}
          {/*preloader*/}
          <div id="preloader">
            <div id="status">
              <div className="spinner-border text-primary avatar-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
          <div className="customizer-setting d-none d-md-block">
            <div className="btn-info rounded-pill shadow-lg btn btn-icon btn-lg p-2" data-bs-toggle="offcanvas" data-bs-target="#theme-settings-offcanvas" aria-controls="theme-settings-offcanvas">
              <i className="mdi mdi-spin mdi-cog-outline fs-22" />
            </div>
          </div>
          {/* Theme Settings */}
          <div className="offcanvas offcanvas-end border-0" tabIndex={-1} id="theme-settings-offcanvas">
            <div className="d-flex align-items-center bg-primary bg-gradient p-3 offcanvas-header">
              <h5 className="m-0 me-2 text-white">Theme Customizer</h5>
              <button type="button" className="btn-close btn-close-white ms-auto" id="customizerclose-btn" data-bs-dismiss="offcanvas" aria-label="Close" />
            </div>
            <div className="offcanvas-body p-0">
              <div data-simplebar className="h-100">
                <div className="p-4">
                  <h6 className="mb-0 fw-semibold text-uppercase">Layout</h6>
                  <p className="text-muted">Choose your layout</p>
                  <div className="row gy-3">
                    <div className="col-4">
                      <div className="form-check card-radio">
                        <input id="customizer-layout01" name="data-layout" type="radio" defaultValue="vertical" className="form-check-input" />
                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="customizer-layout01">
                          <span className="d-flex gap-1 h-100">
                            <span className="flex-shrink-0">
                              <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                              </span>
                            </span>
                            <span className="flex-grow-1">
                              <span className="d-flex h-100 flex-column">
                                <span className="bg-light d-block p-1" />
                                <span className="bg-light d-block p-1 mt-auto" />
                              </span>
                            </span>
                          </span>
                        </label>
                      </div>
                      <h5 className="fs-13 text-center mt-2">Vertical</h5>
                    </div>
                    <div className="col-4">
                      <div className="form-check card-radio">
                        <input id="customizer-layout02" name="data-layout" type="radio" defaultValue="horizontal" className="form-check-input" />
                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="customizer-layout02">
                          <span className="d-flex h-100 flex-column gap-1">
                            <span className="bg-light d-flex p-1 gap-1 align-items-center">
                              <span className="d-block p-1 bg-primary-subtle rounded me-1" />
                              <span className="d-block p-1 pb-0 px-2 bg-primary-subtle ms-auto" />
                              <span className="d-block p-1 pb-0 px-2 bg-primary-subtle" />
                            </span>
                            <span className="bg-light d-block p-1" />
                            <span className="bg-light d-block p-1 mt-auto" />
                          </span>
                        </label>
                      </div>
                      <h5 className="fs-13 text-center mt-2">Horizontal</h5>
                    </div>
                    <div className="col-4">
                      <div className="form-check card-radio">
                        <input id="customizer-layout03" name="data-layout" type="radio" defaultValue="twocolumn" className="form-check-input" />
                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="customizer-layout03">
                          <span className="d-flex gap-1 h-100">
                            <span className="flex-shrink-0">
                              <span className="bg-light d-flex h-100 flex-column gap-1">
                                <span className="d-block p-1 bg-primary-subtle mb-2" />
                                <span className="d-block p-1 pb-0 bg-primary-subtle" />
                                <span className="d-block p-1 pb-0 bg-primary-subtle" />
                                <span className="d-block p-1 pb-0 bg-primary-subtle" />
                              </span>
                            </span>
                            <span className="flex-shrink-0">
                              <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                              </span>
                            </span>
                            <span className="flex-grow-1">
                              <span className="d-flex h-100 flex-column">
                                <span className="bg-light d-block p-1" />
                                <span className="bg-light d-block p-1 mt-auto" />
                              </span>
                            </span>
                          </span>
                        </label>
                      </div>
                      <h5 className="fs-13 text-center mt-2">Two Column</h5>
                    </div>
                    {/* end col */}
                    <div className="col-4">
                      <div className="form-check card-radio">
                        <input id="customizer-layout04" name="data-layout" type="radio" defaultValue="semibox" className="form-check-input" />
                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="customizer-layout04">
                          <span className="d-flex gap-1 h-100">
                            <span className="flex-shrink-0 p-1">
                              <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                              </span>
                            </span>
                            <span className="flex-grow-1">
                              <span className="d-flex h-100 flex-column pt-1 pe-2">
                                <span className="bg-light d-block p-1" />
                                <span className="bg-light d-block p-1 mt-auto" />
                              </span>
                            </span>
                          </span>
                        </label>
                      </div>
                      <h5 className="fs-13 text-center mt-2">Semi Box</h5>
                    </div>
                    {/* end col */}
                  </div>
                  <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Color Scheme</h6>
                  <p className="text-muted">Choose Light or Dark Scheme.</p>
                  <div className="colorscheme-cardradio">
                    <div className="row">
                      <div className="col-4">
                        <div className="form-check card-radio">
                          <input className="form-check-input" type="radio" name="data-bs-theme" id="layout-mode-light" defaultValue="light" />
                          <label className="form-check-label p-0 avatar-md w-100" htmlFor="layout-mode-light">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-shrink-0">
                                <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                  <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Light</h5>
                      </div>
                      <div className="col-4">
                        <div className="form-check card-radio dark">
                          <input className="form-check-input" type="radio" name="data-bs-theme" id="layout-mode-dark" defaultValue="dark" />
                          <label className="form-check-label p-0 avatar-md w-100 bg-dark" htmlFor="layout-mode-dark">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-shrink-0">
                                <span className="bg-white bg-opacity-10 d-flex h-100 flex-column gap-1 p-1">
                                  <span className="d-block p-1 px-2 bg-white bg-opacity-10 rounded mb-2" />
                                  <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10" />
                                  <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10" />
                                  <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column">
                                  <span className="bg-white bg-opacity-10 d-block p-1" />
                                  <span className="bg-white bg-opacity-10 d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Dark</h5>
                      </div>
                    </div>
                  </div>
                  <div id="sidebar-visibility">
                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Sidebar Visibility</h6>
                    <p className="text-muted">Choose show or Hidden sidebar.</p>
                    <div className="row">
                      <div className="col-4">
                        <div className="form-check card-radio">
                          <input className="form-check-input" type="radio" name="data-sidebar-visibility" id="sidebar-visibility-show" defaultValue="show" />
                          <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-visibility-show">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-shrink-0 p-1">
                                <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                  <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column pt-1 pe-2">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Show</h5>
                      </div>
                      <div className="col-4">
                        <div className="form-check card-radio">
                          <input className="form-check-input" type="radio" name="data-sidebar-visibility" id="sidebar-visibility-hidden" defaultValue="hidden" />
                          <label className="form-check-label p-0 avatar-md w-100 px-2" htmlFor="sidebar-visibility-hidden">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column pt-1 px-2">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Hidden</h5>
                      </div>
                    </div>
                  </div>
                  <div id="layout-width">
                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Layout Width</h6>
                    <p className="text-muted">Choose Fluid or Boxed layout.</p>
                    <div className="row">
                      <div className="col-4">
                        <div className="form-check card-radio">
                          <input className="form-check-input" type="radio" name="data-layout-width" id="layout-width-fluid" defaultValue="fluid" />
                          <label className="form-check-label p-0 avatar-md w-100" htmlFor="layout-width-fluid">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-shrink-0">
                                <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                  <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Fluid</h5>
                      </div>
                      <div className="col-4">
                        <div className="form-check card-radio">
                          <input className="form-check-input" type="radio" name="data-layout-width" id="layout-width-boxed" defaultValue="boxed" />
                          <label className="form-check-label p-0 avatar-md w-100 px-2" htmlFor="layout-width-boxed">
                            <span className="d-flex gap-1 h-100 border-start border-end">
                              <span className="flex-shrink-0">
                                <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                  <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Boxed</h5>
                      </div>
                    </div>
                  </div>
                  <div id="layout-position">
                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Layout Position</h6>
                    <p className="text-muted">Choose Fixed or Scrollable Layout Position.</p>
                    <div className="btn-group radio" role="group">
                      <input type="radio" className="btn-check" name="data-layout-position" id="layout-position-fixed" defaultValue="fixed" />
                      <label className="btn btn-light w-sm" htmlFor="layout-position-fixed">Fixed</label>
                      <input type="radio" className="btn-check" name="data-layout-position" id="layout-position-scrollable" defaultValue="scrollable" />
                      <label className="btn btn-light w-sm ms-0" htmlFor="layout-position-scrollable">Scrollable</label>
                    </div>
                  </div>
                  <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Topbar Color</h6>
                  <p className="text-muted">Choose Light or Dark Topbar Color.</p>
                  <div className="row">
                    <div className="col-4">
                      <div className="form-check card-radio">
                        <input className="form-check-input" type="radio" name="data-topbar" id="topbar-color-light" defaultValue="light" />
                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="topbar-color-light">
                          <span className="d-flex gap-1 h-100">
                            <span className="flex-shrink-0">
                              <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                              </span>
                            </span>
                            <span className="flex-grow-1">
                              <span className="d-flex h-100 flex-column">
                                <span className="bg-light d-block p-1" />
                                <span className="bg-light d-block p-1 mt-auto" />
                              </span>
                            </span>
                          </span>
                        </label>
                      </div>
                      <h5 className="fs-13 text-center mt-2">Light</h5>
                    </div>
                    <div className="col-4">
                      <div className="form-check card-radio">
                        <input className="form-check-input" type="radio" name="data-topbar" id="topbar-color-dark" defaultValue="dark" />
                        <label className="form-check-label p-0 avatar-md w-100" htmlFor="topbar-color-dark">
                          <span className="d-flex gap-1 h-100">
                            <span className="flex-shrink-0">
                              <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                              </span>
                            </span>
                            <span className="flex-grow-1">
                              <span className="d-flex h-100 flex-column">
                                <span className="bg-primary d-block p-1" />
                                <span className="bg-light d-block p-1 mt-auto" />
                              </span>
                            </span>
                          </span>
                        </label>
                      </div>
                      <h5 className="fs-13 text-center mt-2">Dark</h5>
                    </div>
                  </div>
                  <div id="sidebar-size">
                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Sidebar Size</h6>
                    <p className="text-muted">Choose a size of Sidebar.</p>
                    <div className="row">
                      <div className="col-4">
                        <div className="form-check sidebar-setting card-radio">
                          <input className="form-check-input" type="radio" name="data-sidebar-size" id="sidebar-size-default" defaultValue="lg" />
                          <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-size-default">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-shrink-0">
                                <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                  <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Default</h5>
                      </div>
                      <div className="col-4">
                        <div className="form-check sidebar-setting card-radio">
                          <input className="form-check-input" type="radio" name="data-sidebar-size" id="sidebar-size-compact" defaultValue="md" />
                          <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-size-compact">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-shrink-0">
                                <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                  <span className="d-block p-1 bg-primary-subtle rounded mb-2" />
                                  <span className="d-block p-1 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 pb-0 bg-primary-subtle" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Compact</h5>
                      </div>
                      <div className="col-4">
                        <div className="form-check sidebar-setting card-radio">
                          <input className="form-check-input" type="radio" name="data-sidebar-size" id="sidebar-size-small" defaultValue="sm" />
                          <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-size-small">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-shrink-0">
                                <span className="bg-light d-flex h-100 flex-column gap-1">
                                  <span className="d-block p-1 bg-primary-subtle mb-2" />
                                  <span className="d-block p-1 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 pb-0 bg-primary-subtle" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Small (Icon View)</h5>
                      </div>
                      <div className="col-4">
                        <div className="form-check sidebar-setting card-radio">
                          <input className="form-check-input" type="radio" name="data-sidebar-size" id="sidebar-size-small-hover" defaultValue="sm-hover" />
                          <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-size-small-hover">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-shrink-0">
                                <span className="bg-light d-flex h-100 flex-column gap-1">
                                  <span className="d-block p-1 bg-primary-subtle mb-2" />
                                  <span className="d-block p-1 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 pb-0 bg-primary-subtle" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Small Hover View</h5>
                      </div>
                    </div>
                  </div>
                  <div id="sidebar-view">
                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Sidebar View</h6>
                    <p className="text-muted">Choose Default or Detached Sidebar view.</p>
                    <div className="row">
                      <div className="col-4">
                        <div className="form-check sidebar-setting card-radio">
                          <input className="form-check-input" type="radio" name="data-layout-style" id="sidebar-view-default" defaultValue="default" />
                          <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-view-default">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-shrink-0">
                                <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                  <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Default</h5>
                      </div>
                      <div className="col-4">
                        <div className="form-check sidebar-setting card-radio">
                          <input className="form-check-input" type="radio" name="data-layout-style" id="sidebar-view-detached" defaultValue="detached" />
                          <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-view-detached">
                            <span className="d-flex h-100 flex-column">
                              <span className="bg-light d-flex p-1 gap-1 align-items-center px-2">
                                <span className="d-block p-1 bg-primary-subtle rounded me-1" />
                                <span className="d-block p-1 pb-0 px-2 bg-primary-subtle ms-auto" />
                                <span className="d-block p-1 pb-0 px-2 bg-primary-subtle" />
                              </span>
                              <span className="d-flex gap-1 h-100 p-1 px-2">
                                <span className="flex-shrink-0">
                                  <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                    <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                    <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                    <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  </span>
                                </span>
                              </span>
                              <span className="bg-light d-block p-1 mt-auto px-2" />
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Detached</h5>
                      </div>
                    </div>
                  </div>
                  <div id="sidebar-color">
                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Sidebar Color</h6>
                    <p className="text-muted">Choose a color of Sidebar.</p>
                    <div className="row">
                      <div className="col-4">
                        <div className="form-check sidebar-setting card-radio" data-bs-toggle="collapse" data-bs-target="#collapseBgGradient.show">
                          <input className="form-check-input" type="radio" name="data-sidebar" id="sidebar-color-light" defaultValue="light" />
                          <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-color-light">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-shrink-0">
                                <span className="bg-white border-end d-flex h-100 flex-column gap-1 p-1">
                                  <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Light</h5>
                      </div>
                      <div className="col-4">
                        <div className="form-check sidebar-setting card-radio" data-bs-toggle="collapse" data-bs-target="#collapseBgGradient.show">
                          <input className="form-check-input" type="radio" name="data-sidebar" id="sidebar-color-dark" defaultValue="dark" />
                          <label className="form-check-label p-0 avatar-md w-100" htmlFor="sidebar-color-dark">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-shrink-0">
                                <span className="bg-primary d-flex h-100 flex-column gap-1 p-1">
                                  <span className="d-block p-1 px-2 bg-white bg-opacity-10 rounded mb-2" />
                                  <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10" />
                                  <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10" />
                                  <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Dark</h5>
                      </div>
                      <div className="col-4">
                        <button className="btn btn-link avatar-md w-100 p-0 overflow-hidden border collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseBgGradient" aria-expanded="false" aria-controls="collapseBgGradient">
                          <span className="d-flex gap-1 h-100">
                            <span className="flex-shrink-0">
                              <span className="bg-vertical-gradient d-flex h-100 flex-column gap-1 p-1">
                                <span className="d-block p-1 px-2 bg-white bg-opacity-10 rounded mb-2" />
                                <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10" />
                                <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10" />
                                <span className="d-block p-1 px-2 pb-0 bg-white bg-opacity-10" />
                              </span>
                            </span>
                            <span className="flex-grow-1">
                              <span className="d-flex h-100 flex-column">
                                <span className="bg-light d-block p-1" />
                                <span className="bg-light d-block p-1 mt-auto" />
                              </span>
                            </span>
                          </span>
                        </button>
                        <h5 className="fs-13 text-center mt-2">Gradient</h5>
                      </div>
                    </div>
                    {/* end row */}
                    <div className="collapse" id="collapseBgGradient">
                      <div className="d-flex gap-2 flex-wrap img-switch p-2 px-3 bg-light rounded">
                        <div className="form-check sidebar-setting card-radio">
                          <input className="form-check-input" type="radio" name="data-sidebar" id="sidebar-color-gradient" defaultValue="gradient" />
                          <label className="form-check-label p-0 avatar-xs rounded-circle" htmlFor="sidebar-color-gradient">
                            <span className="avatar-title rounded-circle bg-vertical-gradient" />
                          </label>
                        </div>
                        <div className="form-check sidebar-setting card-radio">
                          <input className="form-check-input" type="radio" name="data-sidebar" id="sidebar-color-gradient-2" defaultValue="gradient-2" />
                          <label className="form-check-label p-0 avatar-xs rounded-circle" htmlFor="sidebar-color-gradient-2">
                            <span className="avatar-title rounded-circle bg-vertical-gradient-2" />
                          </label>
                        </div>
                        <div className="form-check sidebar-setting card-radio">
                          <input className="form-check-input" type="radio" name="data-sidebar" id="sidebar-color-gradient-3" defaultValue="gradient-3" />
                          <label className="form-check-label p-0 avatar-xs rounded-circle" htmlFor="sidebar-color-gradient-3">
                            <span className="avatar-title rounded-circle bg-vertical-gradient-3" />
                          </label>
                        </div>
                        <div className="form-check sidebar-setting card-radio">
                          <input className="form-check-input" type="radio" name="data-sidebar" id="sidebar-color-gradient-4" defaultValue="gradient-4" />
                          <label className="form-check-label p-0 avatar-xs rounded-circle" htmlFor="sidebar-color-gradient-4">
                            <span className="avatar-title rounded-circle bg-vertical-gradient-4" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div id="sidebar-img">
                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Sidebar Images</h6>
                    <p className="text-muted">Choose a image of Sidebar.</p>
                    <div className="d-flex gap-2 flex-wrap img-switch">
                      <div className="form-check sidebar-setting card-radio">
                        <input className="form-check-input" type="radio" name="data-sidebar-image" id="sidebarimg-none" defaultValue="none" />
                        <label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-none">
                          <span className="avatar-md w-auto bg-light d-flex align-items-center justify-content-center">
                            <i className="ri-close-fill fs-20" />
                          </span>
                        </label>
                      </div>
                      <div className="form-check sidebar-setting card-radio">
                        <input className="form-check-input" type="radio" name="data-sidebar-image" id="sidebarimg-01" defaultValue="img-1" />
                        <label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-01">
                          <img src="assets/images/sidebar/img-1.jpg" alt className="avatar-md w-auto object-fit-cover" />
                        </label>
                      </div>
                      <div className="form-check sidebar-setting card-radio">
                        <input className="form-check-input" type="radio" name="data-sidebar-image" id="sidebarimg-02" defaultValue="img-2" />
                        <label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-02">
                          <img src="assets/images/sidebar/img-2.jpg" alt className="avatar-md w-auto object-fit-cover" />
                        </label>
                      </div>
                      <div className="form-check sidebar-setting card-radio">
                        <input className="form-check-input" type="radio" name="data-sidebar-image" id="sidebarimg-03" defaultValue="img-3" />
                        <label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-03">
                          <img src="assets/images/sidebar/img-3.jpg" alt className="avatar-md w-auto object-fit-cover" />
                        </label>
                      </div>
                      <div className="form-check sidebar-setting card-radio">
                        <input className="form-check-input" type="radio" name="data-sidebar-image" id="sidebarimg-04" defaultValue="img-4" />
                        <label className="form-check-label p-0 avatar-sm h-auto" htmlFor="sidebarimg-04">
                          <img src="assets/images/sidebar/img-4.jpg" alt className="avatar-md w-auto object-fit-cover" />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div id="preloader-menu">
                    <h6 className="mt-4 mb-0 fw-semibold text-uppercase">Preloader</h6>
                    <p className="text-muted">Choose a preloader.</p>
                    <div className="row">
                      <div className="col-4">
                        <div className="form-check sidebar-setting card-radio">
                          <input className="form-check-input" type="radio" name="data-preloader" id="preloader-view-custom" defaultValue="enable" />
                          <label className="form-check-label p-0 avatar-md w-100" htmlFor="preloader-view-custom">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-shrink-0">
                                <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                  <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                            {/* <div id="preloader"> */}
                            <div id="status" className="d-flex align-items-center justify-content-center">
                              <div className="spinner-border text-primary avatar-xxs m-auto" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </div>
                            {/* </div> */}
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Enable</h5>
                      </div>
                      <div className="col-4">
                        <div className="form-check sidebar-setting card-radio">
                          <input className="form-check-input" type="radio" name="data-preloader" id="preloader-view-none" defaultValue="disable" />
                          <label className="form-check-label p-0 avatar-md w-100" htmlFor="preloader-view-none">
                            <span className="d-flex gap-1 h-100">
                              <span className="flex-shrink-0">
                                <span className="bg-light d-flex h-100 flex-column gap-1 p-1">
                                  <span className="d-block p-1 px-2 bg-primary-subtle rounded mb-2" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                  <span className="d-block p-1 px-2 pb-0 bg-primary-subtle" />
                                </span>
                              </span>
                              <span className="flex-grow-1">
                                <span className="d-flex h-100 flex-column">
                                  <span className="bg-light d-block p-1" />
                                  <span className="bg-light d-block p-1 mt-auto" />
                                </span>
                              </span>
                            </span>
                          </label>
                        </div>
                        <h5 className="fs-13 text-center mt-2">Disable</h5>
                      </div>
                    </div>
                  </div>
                  {/* end preloader-menu */}
                </div>
              </div>
            </div>
            <div className="offcanvas-footer border-top p-3 text-center">
              <div className="row">
            
              </div>
            </div>
          </div>
          {/* JAVASCRIPT */}
          {/* apexcharts */}
          {/* Dashboard init */}
          {/* App js */}
        </div>
        
                </div>

    );
}
export default Dashboard;