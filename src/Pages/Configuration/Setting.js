import React, { Component } from "react";
import PageTitle from "../../Components/PageTitle";
import { TextBox, SubmitBtn } from "../../Components/InputElements";
import { ConfigContext } from "../../Context/ConfigContext";
import axios from "axios";
import { slugGenerator } from "../../Components/Utility";
import Swal from "sweetalert2";
import withRouter from "../../Utils/withRouter";

class Setting extends Component {
    static contextType = ConfigContext;
    constructor(props, context) {
        super(props, context);

        this.state = {
            editorData: "",
            master_program_id: "",
            program_code: "",
            program_title: "",
            program_short_title: "",
            program_short_description: "",
            program_long_description: "",
            program_duration: "",
            program_document: "",
            program_fees: "",
            program_type: 1,
            program_picture: "",
            program_slug: "",
            status: false,
        };
        const { token } = this.context;
        const headers = {
            token: `${token}`,
            "Content-Type": "application/json", // Set the content type to JSON if needed
        };
        const { apiURL } = this.context;
        if (this.props.params.master_program_id) {
            this.setState({ master_program_id: this.state.master_program_id });
            axios
                .get(
                    `${apiURL}Masters/GetProgramInfo?master_program_id=${this.props.params.master_program_id}`,
                    { headers }
                )
                .then((response) => {
                    var row = response.data.data[0];
                    this.setState({
                        editorData: row.program_long_description,
                        master_program_id: row.master_program_id,
                        program_code: row.program_code,
                        program_title: row.program_title,
                        program_short_title: row.program_short_title,
                        program_short_description: row.program_short_description,
                        program_long_description: row.program_long_description,
                        program_duration: row.program_duration,
                        program_document: row.program_document,
                        program_fees: row.program_fees,
                        program_type: row.program_type,
                        program_picture: row.program_picture,
                        program_slug: row.program_slug,
                    });
                });
        }
    }
    handleInputChange = (event) => {
        const { name, value } = event.target;

        if (name === "program_title") {
            this.setState({ program_slug: slugGenerator(value) });
        }
        this.setState({ [name]: value });
    };

    handleEditorChange = (event, editor) => {
        const data = editor.getData();
        this.setState({ editorData: data, program_long_description: data });
    };

    handleSubmit = (event) => {
        event.preventDefault();
        const { apiURL } = this.context;
        const { token } = this.context;

        const formData = {
            editorData: this.state.editorData,
            master_program_id: this.state.master_program_id,
            program_code: this.state.program_code,
            program_title: this.state.program_title,
            program_short_title: this.state.program_short_title,
            program_short_description: this.state.program_short_description,
            program_long_description: this.state.program_long_description,
            program_duration: this.state.program_duration,
            program_document: this.state.program_document,
            program_fees: this.state.program_fees,
            program_type: this.state.program_type,
            program_picture: this.state.program_picture,
            program_slug: this.state.program_slug,
        };
        const headers = {
            token: `${token}`,
            "Content-Type": "application/json", // Set the content type to JSON if needed
        };
        this.setState({ status: true });
        axios
            .post(`${apiURL}Masters/CreateProgram`, formData, { headers })
            .then((response) => {
                // Handle the API response here

                if (response.data.success === true) {
                    if (!this.props.params.master_program_id) {
                        this.setState((prevState) => ({
                            editorData: "",
                            master_program_id: "",
                            program_code: "",
                            program_title: "",
                            program_short_title: "",
                            program_short_description: "",
                            program_long_description: "",
                            program_duration: "",
                            program_document: "",
                            program_fees: "",
                            program_type: "",
                            program_picture: "",
                            program_slug: "",
                            status: false,
                        }));
                    } else {
                        this.setState({ status: false });
                    }
                    Swal.fire({
                        title: "<strong>Success</strong>",
                        html: response.data.message,
                        icon: "success",
                    });
                } else {
                    Swal.fire({
                        title: "<strong>Error</strong>",
                        html: response.data.message,
                        icon: "error",
                    });
                }
            })
            .catch((error) => {
                // Handle any errors that occur during the request
                // console.error('API Error:', error);
                // Swal.fire({
                //     title: <strong>Error</strong>,
                //     html: error,
                //     icon: 'error'
                //   })
            });
    };

    render() {
        return (
            <div className="main-content">
                <div className="page-content">
                    <div className="container-fluid">
                        <br />
                        <PageTitle title={` Level Master  `} primary={`Home`} />
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="card">
                                    <div className="card-header align-items-center d-flex">
                                        <h4 className="card-title mb-0 flex-grow-1">
                                            {" "}
                                            Company Setting
                                        </h4>
                                    </div>
                                    <div className="card-body">
                                        <form onSubmit={this.handleSubmit}>
                                            <div className="row gy-4">
                                                <div className="col-md-6">
                                                    <TextBox
                                                        type="text"
                                                        name="smtpServer"
                                                        id="smtp_server"
                                                        label="SMTP Server:"
                                                        hint="Enter SMTP Server"
                                                        value={this.state.smtpServer}
                                                        onChange={this.handleInputChange}
                                                        className="form-control"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <TextBox
                                                        type="text"
                                                        name="smtpPort"
                                                        label="SMTP Port:"
                                                        hint="Enter SMTP Port"
                                                        value={this.state.smtpPort}
                                                        onChange={this.handleInputChange}
                                                        className="form-control"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <TextBox
                                                        type="text"
                                                        name="smtpUsername"
                                                        label="SMTP Username:"
                                                        hint="Enter SMTP Username"
                                                        value={this.state.smtpUsername}
                                                        onChange={this.handleInputChange}
                                                        className="form-control"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <TextBox
                                                        type="password"
                                                        name="smtpPassword"
                                                        label="SMTP Password:"
                                                        hint="Enter SMTP Password"
                                                        value={this.state.smtpPassword}
                                                        onChange={this.handleInputChange}
                                                        className="form-control"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-xxl-3 col-md-12 ">
                                                    {this.props.params.master_program_id ? (
                                                        <SubmitBtn icon={`ri-save-line`} text={`Update`} type={`primary`} status={this.state.status} />
                                                    ) : (
                                                        <SubmitBtn text={`Save`} type={`primary`} icon={`ri-save-line`} />
                                                    )}
                                                </div>
                                            </div>
                                        </form>
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
export default withRouter(Setting);
