import React, { Component } from "react";
import { TextBox } from "../../Components/InputElements";
import axios from "axios";
import Cookies from "js-cookie";
import { ConfigContext } from "../../Context/ConfigContext";
import PageTitle from "../../Components/PageTitle";
import Swal from "sweetalert2";
import { withTranslation } from "react-i18next";

const LetterHead = withTranslation()(
  class LetterHead extends Component {
    static contextType = ConfigContext;

    constructor(props) {
      super(props);
      this.state = {
        letterhead: [],
        fileName: "",
        fileSize: "",
        rows: [],
        selectedImage: null,
        theInputKey: "inkey100",
        uploadLoading: false,
        isPriceUpdated: false,
        isValidExcelFile: false,
        company_letter_head_name: "",
        top: "0",
        bottom: "0",
        left: "0",
        right: "0",
      };
    }

    handleDrop = (acceptedFiles) => {
      this.setState((prevState) => ({
        letterhead: [...prevState.letterhead, ...acceptedFiles],
      }));
    };

    handleUpdatePrices = () => {
      this.setState({ isPriceUpdated: true }, () => {
        Cookies.set("isPriceUpdated", "true");
      });
    };

    GetList = () => {
      const { apiURL, apiHeaderJSON } = this.context;
      const headers = apiHeaderJSON;
      axios.get(`${apiURL}Masters/GetLetterHeads`, { headers }).then((response) => {
        var data = response.data;
        if (response.data.success === true) {
          this.setState({
            rows: data.data,
            loadingList: false
          });
        } else {
          this.setState({ loadingList: false });
        }
      });
    }

    handleSubmit = async (e) => {
      e.preventDefault();
      if (this.state.letterhead.length === 0) {
        alert("File is required");
        return;
      }

      const { apiURL, apiHeaderFile } = this.context;
      const headers = apiHeaderFile;
      var markings = [this.state.top, this.state.bottom, this.state.right, this.state.left]
      const formData = new FormData();
      formData.append("letterhead", this.state.letterhead[0]);
      formData.append("markings", markings);
      formData.append("company_letter_head_name", this.state.company_letter_head_name);

      try {
        const response = await axios.post(`${apiURL}Masters/CreateLetterHead`, formData, { headers });
        const { success, message } = response.data;
        const alertType = success ? 'success' : 'error';

        this.setState({
          letterhead: [],
          top: "0",
          bottom: "0",
          left: "0",
          right: "0",
        });
        this.handleDeleteImage();
        this.GetList();

        Swal.fire({
          title: `<strong>${success ? 'Success' : 'Failed'}</strong>`,
          text: message,
          icon: alertType
        });
      } catch (error) {
        console.error("Error occurred:", error);
        Swal.fire({
          title: 'Error',
          text: 'An error occurred while submitting the data.',
          icon: 'error'
        });
      }
    };



    handleFinish = () => {
      this.setState({ isPriceUpdated: false }, () => {
        Cookies.set("isPriceUpdated", false);
      });
    };

    resetFileInput = () => {
      // Clear the input value
      const fileInput = document.getElementById("fileInput");
      if (fileInput) {
        fileInput.value = null;
      }
      // Keep the same key for the input
      let randomString = Math.random().toString(36);
      this.setState({
        theInputKey: randomString,
      });
    };
    handleInputChange = (e) => {
      this.setState({
        [e.target.name]: e.target.value,

      });

    };

    handleFileChange = (e) => {
      const file = e.target.files[0];

      if (file) {
        const { name, size, type } = file;
        const fileSizeInMB = size / (1024 * 1024);
        const fileExtension = name.split(".").pop().toLowerCase();

        if (
          type.startsWith("image/") &&
          fileExtension.match(/(jpg|jpeg|png)$/)
        ) {
          this.setState({
            selectedImage: URL.createObjectURL(file),
            fileName: name,
            fileSize: `${fileSizeInMB.toFixed(2)} MB`,
            isValidExcelFile: false,
            letterhead: [file], // Update letterhead array
          });
        } else {
          this.setState({
            isValidExcelFile: true,
          });
          console.error("Invalid file type or extension");
        }
      }
    };

    handleDelete = (id) => {
      const { apiURL, apiHeaderJSON } = this.context;
      const headers = apiHeaderJSON;
      Swal.fire(
        {
          title: 'Are you sure?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, delete it!'
        }
      ).then((result) => {
        if (result.isConfirmed) {
          this.setState({ status: true });
          const formData = {
            company_letter_head_id: id
          };
          axios
            .post(`${apiURL}Masters/DeleteLetterHead`, formData, { headers })
            .then((response) => {
              Swal.fire({
                title: `<strong>${response.data.success === true ? 'Success' : 'Failed'}</strong>`,
                text: response.data.message,
                icon: response.data.success === true ? 'success' : 'error',
                timer: 1000,
                timerProgressBar: true,
                showConfirmButton: false,
              })
              this.setState({ status: false });
              if (response.data.success === true) {
                this.setState({ loadingList: true }, (prevState) => {
                  this.GetList();
                })
              }
            })
            .catch((error) => {
              // Handle any errors that occur during the request
              Swal.fire({
                title: <strong>Error</strong>,
                html: error,
                icon: 'error'
              })
            });
        }
      });
    }



    handleDeleteImage = () => {
      this.setState({
        selectedImage: null,
        fileName: "",
        fileSize: "",
        letterhead: [],
        isValidExcelFile: false,
        top: "0",
        bottom: "0",
        left: "0",
        right: "0",
      });
      this.resetFileInput();
    };

    componentDidMount() {
      const storedIsPriceUpdatedValue = Cookies.get("isPriceUpdated");

      if (storedIsPriceUpdatedValue) {
        this.setState({
          isPriceUpdated: JSON.parse(storedIsPriceUpdatedValue),
        });
      }
      this.setState({ loadingList: true }, (prevState) => {
        this.GetList();
      })
    }

    render() {
      return (
        <>
          <div className="main-content">
            <div className="page-content">
              <div className="container-fluid">
                <br />
                <PageTitle title={"Letter Head"} primary={`Home`} />

                <div className="row">
                  <div className="col-4">
                    <div className="card">
                      <div className="card-header justify-content-center align-items-center d-flex">
                        <h3 className="d-flex justify-content-center h4 align-items-center">
                          Submit Your Letter Here.
                        </h3>
                      </div>
                      <div className="card-body">
                        <div>
                          <div className="d-flex justify-content-between align-items-center ml-4">
                            <div className="d-flex justify-content-around align-items-center">
                              <h5 className="fs-13 mb-1">
                                Note*:{" "}
                                <span className="text-danger">
                                  Kindly provide your Letter in JPG format.
                                </span>{" "}
                              </h5>
                            </div>
                          </div>
                          <div className="mt-3 mb-3">
                            <TextBox label={"Letter Head Name"} hint={"Enter Letter Head Name"} type="text" id="company_letter_head_name" name="company_letter_head_name" value={this.state.company_letter_head_name}
                              change={this.handleInputChange} />
                          </div>
                          <div className="dropzone dz-clickable d-flex justify-content-center flex-column align-items-center">
                            <label
                              htmlFor="fileInput"
                              className="dz-message needsclick d-flex justify-content-center flex-column align-items-center cursor-pointer"
                            >
                              <div className="mb-3">
                                <i className="display-4 text-muted ri-upload-cloud-2-fill"></i>
                              </div>
                              <h5>Drop files here or click to upload.</h5>
                            </label>
                          </div>
                          <input
                            type="file"
                            id="fileInput"
                            key={this.state.theInputKey || ""}
                            onChange={this.handleFileChange}
                            style={{ marginTop: "10px", display: "none" }}
                            accept="image/jpeg"
                          />

                          <div className="d-flex justify-content-between mt-3">
                            <label
                              type="submit"
                              className="btn btn-primary btn-label waves-effect waves-light"
                              style={{ marginTop: "10px" }}
                              htmlFor="fileInput"
                            >
                              <i className="ri-file-line label-icon align-middle fs-16 me-2" />
                              Chosse File
                            </label>
                            <button
                              type="button"
                              className="btn btn-success btn-label waves-effect waves-light"
                              style={{ marginTop: "10px" }}
                              onClick={this.handleSubmit}
                            >
                              <i className="ri-save-line label-icon align-middle fs-16 me-2" />
                              Submit
                            </button>
                          </div>

                          <input
                            type="file"
                            id="fileInput"
                            key={this.state.theInputKey || ""}
                            onChange={this.handleFileChange}
                            style={{ marginTop: "10px", display: "none" }}
                            accept="image/jpeg"
                          />

                          <div></div>
                          <ul
                            className="list-unstyled mb-0"
                            id="dropzone-preview"
                            style={{
                              visibility:
                                this.state.fileName === ""
                                  ? "hidden"
                                  : "visible",
                            }}
                          >
                            <li
                              className="mt-2 dz-processing dz-error dz-complete"
                              id="dropzone-preview-list"
                            >
                              <div className="border rounded">
                                <div className="d-flex p-2">
                                  <div className="flex-shrink-0 me-3">
                                    <div className="avatar-sm bg-light rounded">
                                      {this.state.isValidExcelFile ? (
                                        <i
                                          className="ri-alert-fill"
                                          style={{
                                            position: "absolute",
                                            color: "red",
                                            marginLeft: 20,
                                            marginTop: 10,
                                          }}
                                        ></i>
                                      ) : (
                                        <div></div>
                                      )}
                                      <center>
                                        <i
                                          className="ri-image-fill"
                                          style={{
                                            fontSize: 28,
                                            color: "green",
                                          }}
                                        ></i>
                                      </center>
                                    </div>
                                  </div>
                                  <div className="flex-grow-1">
                                    <div className="pt-1">
                                      <h5
                                        className="fs-13 mb-1"
                                        data-dz-name=""
                                      >
                                        {this.state.fileName}
                                      </h5>
                                      <p
                                        className="fs-13 text-muted mb-0"
                                        data-dz-size=""
                                      >
                                        <strong>{this.state.fileSize}</strong>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 ms-3 d-flex justify-content-center align-items-center">
                                    <button
                                      data-dz-remove=""
                                      onClick={this.handleDeleteImage}
                                      className="btn btn-sm btn-outline-danger"
                                    >
                                      <i className="ri-delete-bin-line"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div className='card'>
                        <div className="col-md-12">
                          <table className={`table table-bordered table-stripped`}>
                            <thead className='table-light '>
                              <tr>
                                <th>Letter Head Title</th>

                                <th className="text-center" width={120} >Action</th>
                              </tr>
                            </thead>
                            <tbody >
                              {
                                this.state.rows.map((row) => {
                                  return <tr key={row.company_letter_head_id}>
                                    <td>{row.company_letter_head_name}</td>
                                    <td className='d-flex justify-content-around'>
                                      <button onClick={() => this.handleDelete(row.company_letter_head_id)} className="btn-icon btn btn-sm btn-outline-danger"> <i className="ri-delete-bin-line"></i> </button>
                                    </td>
                                  </tr>
                                })
                              }
                            </tbody>

                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-8" >
                    <div className="card" style={{ height: '350mm', width: '220mm' }} >
                      <div className="card-header" >
                        <div
                          className="row mt-1 d-flex align-items-center"
                          style={{ marginTop: "-20px" }}
                        >
                          <div className="col-md-8">
                            <h4 className="card-title mb-0">Preview Tab</h4>
                          </div>

                          <div className="col-md-1 text-center">
                            <TextBox
                              type="Number"
                              id="top"
                              name="top"
                              label="top"
                              hint="   "
                              value={this.state.top}
                              change={this.handleInputChange}
                            />
                          </div>
                          <div className="col-md-1 text-center">
                            <TextBox
                              type="Number"
                              id="bottom"
                              name="bottom"
                              label="Bottom"
                              hint="   "
                              value={this.state.bottom}
                              change={this.handleInputChange}
                            />
                          </div>
                          <div className="col-md-1 text-center">
                            <TextBox
                              type="Number"
                              id="left"
                              name="left"
                              label="left"
                              hint="   "
                              value={this.state.left}
                              change={this.handleInputChange}
                            />
                          </div>
                          <div className="col-md-1 text-center">
                            <TextBox
                              type="Number"
                              id="right"
                              name="right"
                              label="right"
                              hint="   "
                              value={this.state.right}
                              change={this.handleInputChange}
                              state={{ with: "20%" }}
                            />
                          </div>

                          {/* Additional code for TextBox components */}
                        </div>
                      </div>
                      {this.state.selectedImage ? (
                      <div>
                        <div className="card-body">
                          <p className="text-muted"></p>
                          <div
                            className="bubble-editor"
                            style={{
                              position: "relative", width: '210mm', height: '297mm', position: 'absolute'
                            }}>
                            <div
                              className="shadow"
                              style={{
                                height: "1.5px",
                                width: "100%",
                                borderTop: "2px dotted #666",
                                position: "absolute",
                                top: `${this.state.top}mm`,
                                zIndex: "9",
                              }}
                            ></div>
                            <div
                              className="shadow"
                              style={{
                                height: "100%",
                                width: "1.5px",
                                borderLeft: "2px dotted #666",
                                position: "absolute",
                                left: `${this.state.left}mm`,
                                zIndex: "9",
                              }}
                            ></div>
                            <div
                              className="shadow"
                              style={{
                                height: "100%",
                                width: "1.5px",
                                borderRight: "2px dotted #666",
                                position: "absolute",
                                right: `${this.state.right}mm`,
                                zIndex: "9",
                              }}
                            ></div>
                            <div
                              className="shadow"
                              style={{
                                height: "1.5px",
                                width: "100%",
                                borderBottom: "2px dotted #666",
                                position: "absolute",
                                bottom: `${this.state.bottom}mm`,
                                zIndex: "9",
                              }}
                            ></div>
                            {this.state.selectedImage ? (
                              <img
                                src={this.state.selectedImage}
                                alt="Selected Preview"
                                style={{ width: "210mm", height: "297mm" }}
                              />
                            ) : (
                              <></>
                            )}
                          </div>
                        </div>
                      </div>
 ) : (
                      <div className="card-body">
                        <h3 className="text-muted">Please Select Image...</h3>
                      </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }
  }
);

export default LetterHead;
