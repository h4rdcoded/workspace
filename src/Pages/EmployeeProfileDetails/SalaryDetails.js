import axios from 'axios';
import React, { Component } from 'react'
import { ConfigContext } from '../../Context/ConfigContext';
import withRouter from '../../Utils/withRouter';

class SalaryDetails extends Component {
    static contextType = ConfigContext;
    constructor(props) {
        super(props);
        this.state = {
            loadingList: false,
            postLoading: false,
            employee_info: [],
            salaries: [],
            salaries_statutory: [],
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
                        salaries: data.salary_head,
                        salaries_statutory: data.salary_statutory,
                        employee_info: data.employee,
                        loadingList: false,
                    });
                } else {
                    this.setState({ loadingList: false });
                }
        });
    };


    render() {
        const { loadingList, salaries, employee_info, salaries_statutory } = this.state;
        return loadingList === true ? (
            <center>Loading...</center>
        ) : (
            <div className='card'>
                <div className='card-body'>

                    <div class="card-header bg-light bg-gradient">
                        <h6 className="card-title mb-0 text-center">SALARY DETAILS</h6>
                    </div>

                    <div className="row">
                        <div className="col-lg-6">
                            <div className="card-body">
                                <div className="card-header">
                                    <h6 className="card-title mb-0 text-center">SALARY TYPES</h6>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-sm text-center table-hover table-nowrap" >
                                        <thead className="bg-primary bg-gradient text-light">
                                            <tr>
                                                <th scope="col">SALARY TYPES</th>
                                                <th scope="col">PER ANNUM</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salaries.map((row) => (
                                                <tr key={row.employee_salary_head_id}>
                                                    <td>{row.company_salary_head}</td>
                                                    <td>{row.amount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className='bg-primary bg-gradient text-light'>

                                            <tr>
                                                <th>Gross</th>
                                                <th>{employee_info.gross}</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-6">
                            <div className="card-body">
                                <div className="card-header">
                                    <h6 className="card-title mb-0 text-center">SALARY STATUTORY TYPES</h6>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-sm text-center table-hover table-nowrap">
                                        <thead className="bg-primary bg-gradient text-light">
                                            <tr>
                                                <th scope="col">SALARY STATUTORY TYPES</th>
                                                {/* <th scope="col">CALCULATED AMOUNT</th> */}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {salaries_statutory.map((row) => (
                                                <tr key={row.employee_salary_statutory_id}>
                                                    <td>{row.company_salary_statutory_title}</td>
                                                    <td>{}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className='bg-primary bg-gradient text-light'>
                                            <tr>
                                                {/* <th>CTC</th> */}
                                                <th>CTC {employee_info.cts}</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
export default withRouter(SalaryDetails);



