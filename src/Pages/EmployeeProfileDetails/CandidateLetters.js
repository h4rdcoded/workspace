import React, { Component } from 'react';
import axios from 'axios';
import withRouter from '../../Utils/withRouter';
import { ConfigContext } from '../../Context/ConfigContext';
import Swal from 'sweetalert2';

class Letters extends Component {
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
    };
  }

  componentDidMount() {
    this.setState({ loadingList: true }, () => {
      this.GetList();
    });
  }

  GetList = () => {
    const { apiHeaderJSON, apiURL } = this.context;
    const headers = apiHeaderJSON;
    const employee_id = this.props.params.employee_id;

    axios.get(`${apiURL}Employees/GetProfile?employee_id=${employee_id}`, { headers }).then((response) => {
      var data = response.data.data.letters;
      if (response.data.success === true) {
        this.setState({
          rows: data,
          document_info: data.employee,
          documents: data.documents,
          letters: data.letters,
          loadingList: false,
        });
      } else {
        this.setState({ loadingList: false });
      }
    });
  };

  AcceptRejectLetter = (employee_id, employee_letter_id, accept_reject) => {
    Swal.fire({
      title: 'Submit Remark',
      input: 'text',
      inputPlaceholder: 'Enter your Remark',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'Remark cannot be empty';
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        var formData = {
          employee_id: employee_id,
          employee_letter_id: employee_letter_id,
          employee_letter_status: accept_reject,
        };
        if (result.value) {
          formData.employee_letter_remark = result.value;
        } else {
          formData.employee_letter_remark = '';
        }
        const { apiURL, apiHeaderJSON } = this.context;
        const headers = apiHeaderJSON;

        axios.post(`${apiURL}Employees/AcceptRejectLetter`, formData, { headers })
          .then((response) => {
            Swal.fire({
              title: `<strong>${response.data.message}</strong>`,
              icon: 'success',
            });
            this.GetList();
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      }
    });
  };


  render() {
    const { rows, loadingList } = this.state;

    return loadingList === true ? (
      <center>Loading...</center>
    ) : (

      <div classname="main-content">
        <div classname="page-content">
          <div classname="container-fluid">
            {rows.map((row) => (
              <div>
                <div className='row'>
                  <div className='col-lg-12'>
                    <div className={`card ${row.employee_letter_status === 1 ? 'ribbon-box border shadow-none ribbon-success' : (row.employee_letter_status === 2 ? 'ribbon-box border shadow-none ribbon-danger' : ' ')}`}>
                      <div className="card-body text-muted">
                        <div className={`${row.employee_letter_status === 1 ? 'ribbon-three ribbon-three-success' : (row.employee_letter_status === 2 ? 'ribbon-three ribbon-three-danger' : ' ')}`}>
                          <span>{row.employee_letter_status === 1 ? 'Accepted' : (row.employee_letter_status === 2 ? 'Rejected' : ' ')}</span></div>

                        <div class="card-header bg-light bg-gradient">
                          <h6 className="card-title mb-0 text-center">LETTERS</h6>

                        </div>
                        <div className="table-responsive">
                          <table className="table table-borderless mb-0">
                            <div>
                              <div className="card-body">

                                <tr key={row.employee_letter_id}>
                                  <td>

                                    <h6 className="card-title">{row.company_letter_title}:</h6>
                                    <p className="card-text text-muted mb-0" dangerouslySetInnerHTML={{ __html: row.employee_letter_content }}>
                                    </p>
                                  </td>

                                </tr>

                              </div>
                              <div className="card-footer">
                                {row.employee_letter_status !== 1 && row.employee_letter_status !== 2 && (
                                  <a className="link-success float-end">
                                    <button
                                      onClick={() => this.AcceptRejectLetter(row.employee_id, row.employee_letter_id, 2)}
                                      type="button"
                                      className="btn btn-danger btn-label waves-effect waves-light"
                                    >
                                      <i className="bx bx-x-circle label-icon align-middle fs-20 me-2"></i> Reject
                                    </button>
                                  </a>
                                )}
                                {row.employee_letter_status !== 1 && row.employee_letter_status !== 2 && (
                                  <a className="link-success float-end">
                                    <button
                                      onClick={() => this.AcceptRejectLetter(row.employee_id, row.employee_letter_id, 1)}
                                      type="button"
                                      className="btn btn-success btn-label waves-effect waves-light"
                                    >
                                      <i className="bx bx-check-circle label-icon align-middle fs-20 me-2"></i> Accept
                                    </button>
                                  </a>
                                )}

                              </div>
                            </div>

                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Letters);
