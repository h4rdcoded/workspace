import React, { Component } from "react";
import axios from "axios";
import withRouter from "../../Utils/withRouter";
import { ConfigContext } from "../../Context/ConfigContext";
import Swal from "sweetalert2";
import { saveAs } from 'file-saver';
import { TextBox } from "../../Components/InputElements";



class Documents extends Component {
  static contextType = ConfigContext;
  constructor(props) {
    super(props);
    this.state = {
      rows: [],
      loadingList: false,
      postLoading: false,
      document_info: [],
      documents: [],
      letters: [],
      salaries: [],
      DownloadDocument: [],
    };
  }

  componentDidMount() {
    this.setState({ loadingList: true }, (prevState) => {
      this.GetList();
    });
  }

  RemarkDocument = (employee_id, row) => {
    Swal.fire({
      title: "Submit Remark",
      input: "text",
      inputValue: row.document_remark,
      inputPlaceholder: "Enter your Remark",
      showCancelButton: true,
      confirmButtonText: "Submit",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value) {
          return "Remark cannot be empty";
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        var formData = {
          employee_id: employee_id,
          employee_document_id: row.employee_document_id,
          document_remark: result.value,
        };

        const { apiHeaderJSON, apiURL } = this.context;
        const headers = apiHeaderJSON;

        axios
          .post(`${apiURL}Employees/RemarkDocument`, formData, { headers })
          .then((response) => {
            Swal.fire({
              title: `<strong>${response.data.message}</strong>`,
              icon: "success",
            });
            this.GetList();
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }
    });
  };

  VerifyDocument = (employee_document_id) => {
    const employee_id = this.props.params.employee_id;
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Verified it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        var formData = {
          employee_document_id: employee_document_id,
          employee_id: employee_id,
        };
        console.log(formData);
        const { apiHeaderJSON, apiURL } = this.context;
        const headers = apiHeaderJSON;

        axios
          .post(`${apiURL}Employees/VerifyDocument`, formData, { headers })
          .then((response) => {
            console.log("response", response);
            this.GetList();
            Swal.fire({
              title: `<strong>${response.data.message}</strong>`,
              icon: "success",
            });
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }
    });
  };

  UnVerifyDocument = (employee_document_id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, UnVerified it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        var formData = {
          employee_document_id: employee_document_id,
        };

        const { apiHeaderJSON, apiURL } = this.context;
        const headers = apiHeaderJSON;

        axios
          .post(`${apiURL}Employees/UnVerifyDocument`, formData, { headers })
          .then((response) => {
            this.GetList();
            Swal.fire({
              title: `<strong>${response.data.message}</strong>`,
              icon: "success",
            });
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }
    });
  };

  handleFileUpload = (event, row) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("employee_document", file);
    formData.append("employee_document_id", row.employee_document_id);

    const { apiHeaderFile, apiURL } = this.context;
    const headers = apiHeaderFile;

    axios
      .post(
        `${apiURL}Employees/UploadEmployeeDocument`,
        formData,
        { headers }
      )
      .then((response) => {
        Swal.fire({
          title: `<strong>${response.data.message}</strong>`,
          icon: "success",
        });
        this.GetList();
      })
      .catch((error) => {
        console.error("Error uploading file:", error);
      });
  };


  GetList = () => {
    const { apiHeaderJSON, apiURL } = this.context;
    const headers = apiHeaderJSON;
    const employee_id = this.props.params.employee_id;


    axios
      .get(
        `${apiURL}Employees/GetProfile?employee_id=${employee_id}`,
        { headers }
      )
      .then((response) => {
        var data = response.data.data;
        if (response.data.success === true) {
          this.setState({
            rows: data.documents || [],
            loadingList: false,
          });
        } else {
          this.setState({ loadingList: false });
        }
      });
  };

  DownloadDocument = (employee_document_id, event) => {
    event.preventDefault();

  };

  render() {
    const { rows, loadingList } = this.state;
    return loadingList === true ? (
      <center>Loading...</center>
    ) : (
      <div classname="main-content">
        <div classname="page-content">
          <div classname="container-fluid">
            <div>
              <div className="card">
                <div className="card-body">
                  <div class="card-header  ">
                    <h6
                      className="card-title mb-0 text-center"
                    >
                      DOCUMENTS
                    </h6>
                  </div>
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="table-responsive">
                        <table className="table table-borderless text-center table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th scope="col" className="text-start">
                                File Name
                              </th>
                              <th scope="col">Document ID Number</th>
                              <th scope="col">Remark</th>
                              <th scope="col">Status</th>
                              <th scope="col">Upload</th>
                              <th scope="col">Verified</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row) => (
                              <tr key={row.employee_document_id}>
                                   <td>
                                  <div className="d-flex align-items-center">
                                    <div className="avatar-sm">
                                      <div className="avatar-title bg-danger-subtle text-danger rounded fs-20">
                                        <i className="ri-file-3-fill" />
                                      </div>
                                    </div>
                                    <div className="ms-3 flex-grow-1">
                                      <h6 className="fs-15 mb-0 text-start">
                                        <a href="#" onClick={(e) => this.DownloadDocument(row.employee_document_id, e)}>
                                          {row.employee_document_type_title}
                                        </a>
                                        <div
                                          className=""
                                          style={{
                                            width: "200px",
                                            height: "24px",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          }}
                                        >
                                          <small className="text-muted">
                                            {row.document_remark ||
                                              "No Remark !!"}
                                          </small>
                                        </div>
                                      </h6>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                <div className="col-sm-12">
                                      <TextBox
                                        type="TextArea"
                                        id="employee_code"
                                        name=" "
                                        label=""
                                        hint="Enter ID Number"
                                        value={this.state.employee_code}
                                        change={this.handleInputChange}
                                      />
                                    </div>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className={`${row.document_status_label === "Verified" || row.document_status_label === "Pending" ? "disabled" : ""} btn btn-light btn-sm btn-label waves-effect right waves-light`}
                                    onClick={() =>
                                      this.RemarkDocument(
                                        this.props.params.employee_id,
                                        row
                                      )
                                    }
                                  >
                                    <i className="bx bx-info-circle label-icon align-middle fs-16 ms-2" />
                                    Remark
                                  </button>
                                </td>
                                <td>
                                  <span
                                    className={`badge bg-${row.document_status_color}`}
                                  >
                                    {row.document_status_label}
                                  </span>
                                </td>
                                <td>
                                  <input
                                    type="file"
                                    id={`fileInput-${row.employee_document_id}`}
                                    style={{ display: "none" }}
                                    onChange={(e) =>
                                      this.handleFileUpload(e, row)
                                    }
                                    accept="image/png, image/jpg, image/jpeg"
                                  />
                                  {row.document_status_label === "Uploaded" ? (
                                    <>
                                      <label
                                        htmlFor={`fileInput-${row.employee_document_id}`}
                                        className="btn btn-secondary btn-sm btn-label waves-effect waves-light"
                                      >
                                        <i className="ri-file-upload-line label-icon align-middle fs-16 me-2" />
                                        Change
                                      </label>
                                    </>
                                  ) : (
                                    <>
                                      <label
                                        htmlFor={`fileInput-${row.employee_document_id}`}
                                        className={`${row.document_status_label === "Verified" ? "disabled" : ""} btn btn-primary btn-sm btn-label waves-effect waves-light`}
                                      >
                                        <i className={`ri-file-upload-line label-icon align-middle fs-16 me-2`} />
                                        Upload
                                      </label>
                                    </>
                                  )}
                                </td>
                                <td>
                                  {/* <button
                                    type="button"
                                    className={`${row.document_status_label === "Pending" ? "disabled" : " "} btn btn-success btn-sm btn-label waves-effect right waves-light`}
                                    onClick={() => this.VerifyDocument(row.employee_document_id)} >
                                    <i className=" ri-check-double-line label-icon align-middle fs-16 ms-2" />
                                    Verify
                                  </button> */}
                                  {row.document_status_label === "Verified" ? (
                                    <>
                                      <button
                                        type="button"
                                        className={`${row.document_status_label ===
                                          "Pending"
                                          ? "disabled"
                                          : " "
                                          } btn btn-secondary btn-sm btn-label waves-effect right waves-light`}
                                        onClick={() =>
                                          this.UnVerifyDocument(
                                            row.employee_document_id
                                          )
                                        }
                                      >
                                        <i className="ri-close-line label-icon align-middle fs-16 ms-2" />
                                        Unverified
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className={`${row.document_status_label ===
                                          "Pending"
                                          ? "disabled"
                                          : " "
                                          } btn btn-success btn-sm btn-label waves-effect right waves-light`}
                                        onClick={() =>
                                          this.VerifyDocument(row.employee_document_id, row.employee_id)
                                        }
                                      >
                                        <i className=" ri-check-double-line label-icon align-middle fs-16 ms-2" />
                                        Verify
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
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
export default withRouter(Documents);
