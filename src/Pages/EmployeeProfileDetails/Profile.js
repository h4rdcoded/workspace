import React, { Component } from "react";
import axios from "axios";
import withRouter from "../../Utils/withRouter";
import { ConfigContext } from "../../Context/ConfigContext";
import Documents from "./Documents"
import SalaryDetails from "./SalaryDetails"
import CandidateLetters from "./CandidateLetters"


class CandidateProfiles extends Component {
  static contextType = ConfigContext;
  constructor(props) {
    super(props);
    this.state = {
      rows: [],
      loadingList: false,
      postLoading: false,
      employee_info: [],
      documents: [],
      letters: [],
      salaries: [],
      employee_department: [],
      employee_designation: [],
      employee_location: [],
      employee_grades: [],
    };
  }

  componentDidMount() {
    this.setState({ loadingList: true }, (prevState) => {
      this.GetList();
    });
  }

  GetList = () => {
    const { apiHeaderJSON, apiURL } = this.context;
    const headers = apiHeaderJSON;
    const employee_id = this.props.params.employee_id;

    axios.get(`${apiURL}Employees/GetProfile?employee_id=${employee_id}`, { headers }).then((response) => {
      var data = response.data.data;
      if (response.data.success === true) {
        this.setState({
          rows: data,
          employee_info: data.employee,
          documents: data.documents,
          letters: data.letters,
          salaries: data.salary_head,
          loadingList: false,
        });
        var GetMastersEmployeeData = data.employee;
        this.GetMastersEmployee(GetMastersEmployeeData);
      } else {
        this.setState({ loadingList: false });
      }
    });
  };

  GetMastersEmployee = (GetMastersEmployeeData) => {
    const { apiURL, apiHeaderJSON, } = this.context;
    const headers = apiHeaderJSON;
    var formData = {
      department_id: GetMastersEmployeeData.department_id,
      designation_id: GetMastersEmployeeData.designation_id,
      grade_id: GetMastersEmployeeData.grade_id,
      location_id: GetMastersEmployeeData.location_id,
    }
    axios.get(`${apiURL}Employees/GetMastersEmployee`, {
      params: formData,
      headers: headers
    }).then((response) => {
      var data = response.data;
      if (response.data.success === true) {
        this.setState({
          employee_department: data.data.department,
          employee_designation: data.data.designation,
          employee_location: data.data.location,
          employee_grades: data.data.grades,
          loadingList: false,
        });
      } else {
        this.setState({ loadingList: false });
      }
    });
  };

  render() {
    const { employee_info, loadingList, documents, letters, salaries, employee_department, employee_designation, employee_location, employee_grades } = this.state;

    return loadingList === true ? (
      <center>Loading...</center>
    ) : (
      <div className="main-content">
        <div className="page-content">
          <div className="container-fluid">
            <div className="profile-foreground position-relative mx-n4 mt-n4">
              <div className="profile-wid-bg">
                <img src={`${process.env.PUBLIC_URL}/assets/images/bg-img1.png`} alt="profile-wid-img" className="profile-wid-img" />
              </div>
            </div>
            <div className="pt-4 mb-4 mb-lg-3 pb-lg-4 profile-wrapper">
              <div className="row g-4">
                <div className="col-auto">
                  <div className="avatar-lg">
                    <img
                      src={`${process.env.PUBLIC_URL}/assets/Image.jpg`}
                      alt=""
                      className="img-thumbnail rounded-circle"
                    />

                  </div>
                </div>

                <div className="col">
                  <div className="p-2">
                    <h3 className="text-white mb-1">{employee_info.employee_name}</h3>
                    <p className="text-white text-opacity-75">{employee_designation.designation_title}</p>
                    <div className="hstack text-white-50 gap-1">
                      <div className="me-2"><i className="ri-building-line me-1 text-white text-opacity-75 fs-16 align-middle" />{employee_department.department_title}</div>
                      <div>
                        <i className="ri-map-pin-user-line me-1 text-white text-opacity-75 fs-16 align-middle" />{employee_location.location_title}
                      </div>
                    </div>

                  </div>
                </div>

                <div className="col-12 col-lg-auto order-last order-lg-0">
                  <div className="row text text-white-50 text-center">
                    <div className="col-lg-6 col-5">
                      <div className="p-2">
                        <h4 className="ri-notification-4-fill text-light ms-4"></h4>
                        <p className="fs-14 mb-0">Notification's</p>
                      </div>
                    </div> 
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-12">
                <div>
                  <div className="d-flex profile-wrapper">
                  <ul className="nav nav-pills animation-nav profile-nav gap-2 gap-lg-3 flex-grow-1" >
                      <li className="nav-item">
                        <a  className="nav-link fs-14 active" href="#overview-tab" >
                          <i className="ri-airplay-fill d-inline-block d-md-none" /> <span className="d-none d-md-inline-block">Overview</span>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link fs-14 " href="#activities" >
                          <i className="ri-list-unordered d-inline-block d-md-none" /> <span className="d-none d-md-inline-block">Salary Details</span>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link fs-14 " href="#projects" >
                          <i className="ri-price-tag-line d-inline-block d-md-none" /> <span className="d-none d-md-inline-block">Letters</span>
                        </a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link fs-14 " href="#documents" >
                          <i className="ri-folder-4-line d-inline-block d-md-none" /> <span className="d-none d-md-inline-block">Documents</span>
                        </a>
                      </li>
                    </ul>
                  </div>

                  <div className="tab-content pt-4 text-muted">
                    <div
                      className="tab-pane active"
                      id="overview-tab"
                      role="tabpanel"
                    >
                      <div className="row">
                        <div className="col-xxl-12">
                          <div className="card">
                            <div className="card-body">
                              <h5 className="card-title mb-5">
                                Complete Your Profile
                              </h5>
                              <div className="progress animated-progress custom-progress progress-label">
                                <div
                                  className="progress-bar bg-danger"
                                  role="progressbar"
                                  style={{ width: "30%" }}
                                  aria-valuenow={30}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                >
                                  <div className="label">30%</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="card">
                            <div className="row">
                              <div
                                className="col-md-5 d-flex justify-content-center align-items-center"
                                style={{ borderRight: "2px dashed #c7c7c7" }}
                              >
                                <div className="" style={{ width: "40%" }}>
                                  <img
                                    src={`${process.env.PUBLIC_URL}/assets/Image.jpg`}
                                    alt=""
                                    className="img-thumbnail rounded-circle"
                                  />

                                </div>
                                <div className="profile-info" style={{ marginLeft: "30px" }}>
                                  <h5 className="text-start">
                                    {employee_info.employee_name}
                                  </h5>
                                  <span className="text-muted text-center">
                                    {employee_info.employee_email_address}
                                  </span>
                                  <h5 className="text-start mt-3">
                                    Date Of Join
                                  </h5>
                                  <span className="text-muted text-center">
                                    {employee_info.employee_joining_date}
                                  </span>
                                </div>
                              </div>
                              <div className="col-md-7">
                                <div className="card-body">
                                  <div class="card-header bg-light bg-gradient">
                                    <h6 className="card-title mb-0 text-start">INFORMATION</h6>

                                  </div>
                                  <div className="table-responsive">
                                    <table className="table table-borderless mb-0">
                                      <tbody>
                                        <tr>
                                          <th className="ps-0" scope="row">Full Name :</th>
                                          <td className="text-muted">{employee_info.employee_name}</td>
                                        </tr>
                                        <tr>
                                          <th className="ps-0" scope="row">Mobile :</th>
                                          <td className="text-muted">{employee_info.employee_mobile_number}</td>
                                        </tr>
                                        <tr>
                                          <th className="ps-0" scope="row">Department :</th>
                                          <td className="text-muted">{employee_department.department_title}</td>
                                        </tr>
                                        <tr>
                                          <th className="ps-0" scope="row">Location :</th>
                                          <td className="text-muted">{employee_location.location_title}
                                          </td>
                                        </tr>
                                        <tr>
                                          <th className="ps-0" scope="row">Grades :</th>
                                          <td className="text-muted">{employee_grades.grade_title}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="" id="activities" role="tabpanel" >
                        {salaries.length > 0 ? <SalaryDetails salaries={salaries} /> : <div></div>}
                      </div>
                      <div className="" id="projects" role="tabpanel" >
                        {letters.length > 0 ? <CandidateLetters letters={letters} /> : <div></div>}
                      </div>
                      <div className="" id="documents" role="tabpanel">
                        {documents.length > 0 ? <Documents docuemnts={documents} /> : <div></div>}
                      </div>
                      {/* {salaries.length > 0 ? <SalaryDetails salaries={salaries} /> : <div></div>}
                      {letters.length > 0 ? <CandidateLetters letters={letters} /> : <div></div>}
                      {documents.length > 0 ? <Documents docuemnts={documents} /> : <div></div>} */}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default withRouter(CandidateProfiles);
