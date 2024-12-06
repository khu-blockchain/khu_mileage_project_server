const { GetSwMileageTokenRankDTO } = require("../dtos/swMileageToken.dto")

const sortRank = (rankList, studentList, from) => {

    if (!Array.isArray(studentList) || studentList.length === 0) {
        throw new Error("Student list is empty. Please provide valid student data.");
    }

    const sortedRankList = rankList.map((data, index) => {
        const matchingStudent = studentList.find(student => (student.wallet_address).upper() === (data.account).upper())
        
        console.log("RankList Wallet Address:", data.account);
        console.log(typeof(data.account))
        console.log("Student Wallet Addresses:", studentList.map(student => student.wallet_address));
        console.log(matchingStudent)

        if (!matchingStudent) {
            throw new Error(`No matching student found for wallet address: ${data.account}`);
        }

        return new GetSwMileageTokenRankDTO({
            rank: from + index,
            id: matchingStudent.student_id,
            name: matchingStudent.name,
            email: matchingStudent.email,
            phone_number: matchingStudent.phone_number,
            department: matchingStudent.department,
            wallet_address: data.account,
            balance: data.balance,
        })
    })

    return sortedRankList
}


module.exports = {
    sortRank
};
