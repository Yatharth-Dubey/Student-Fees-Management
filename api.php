<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
require 'vendor/autoload.php';//firebase/php-jwt package
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
$secret_key = "YatharthDubeySecret";//Secret key for signing token
$user = [
    "yatharth" => "2004",
    "admin" => "0147"
];
$servername = "localhost";
$username = "root";
$password = "YATdub147@";
$dbname = "rbs";
// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $conn->connect_error]);
    exit();
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    http_response_code(200);
    exit();
}
// Get request method
$method = $_SERVER['REQUEST_METHOD'];
if ($method == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $endpoint = $_GET['endpoint'] ?? '';
    switch ($endpoint) {
        case 'Submitted':
            handleSubmitted($conn, $input);
            break;
        case 'fees-structure':
            handleFeesStructure($conn, $input);
            break;
        case 'view-structure':
            handleViewStructure($conn, $input);
            break;
        case 'Already-Submitted':
            handleAlreadySubmitted($conn, $input);
            break;
        case 'FetchStudents':
            handleFetchStudents($conn, $input);
            break;
        case 'FeeMonthStatus':
            handleFeeMonthStatus($conn, $input);
            break;
        case 'FeeStatusFetch':
            handleFeeStatusFetch($conn, $input);
            break;
        case 'fetchStudent':
            handleFetchStudent($conn, $input);
            break;
        case 'StudentReg/fetch':
            handleStudentRegFetch($conn, $input);
            break;
        case 'reg/bulk':
            handleRegBulk($conn, $input);
            break;
        case 'StudentReg/register':
            handleStudentRegRegister($conn, $input);
            break;
        case 'Check':
            handleCheck($conn, $input);
            break;
        case 'Report':
            handleReport($conn, $input);
            break;
        case 'reg':
            handleReg($conn, $input);
            break;
        case 'admin':
            handleAdmin($conn, $input, $secret_key);
            break;
        default:
            http_response_code(404);
            echo json_encode(["error" => "Endpoint not found"]);
            break;
    }
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
function handleSubmitted($conn, $data) {
    $required = ['rollno', 'studentname', 'classid', 'classsession', 'selectedMonths', 'total', 'timeRecord'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required field: $field"]);
            return;
        }
    }
    $rollno = $data['rollno'];
    $studentname = $data['studentname'];
    $classid = $data['classid'];
    $classsession = $data['classsession'];
    $selectedMonths = $data['selectedMonths'];
    $total = $data['total'];
    $timeRecord = $data['timeRecord'];
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];
    // Check if record exists
    $checkSql = "SELECT COUNT(*) as count FROM submitted_months WHERE rollno=? AND studentname=? AND classid=? AND classsession=?";
    $stmt = $conn->prepare($checkSql);
    $stmt->bind_param("ssss", $rollno, $studentname, $classid, $classsession);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    $months = ["January", "February", "March", "April", "May", "June", 
               "July", "August", "September", "October", "November", "December"];
    if ($result['count'] == 0) {
        // First submission
        $feeSql = "SELECT * FROM fees WHERE class = ? AND classsession = ?";
        $stmt = $conn->prepare($feeSql);
        $stmt->bind_param("ss", $classid, $classsession);
        $stmt->execute();
        $feeResult = $stmt->get_result();
        if ($feeResult->num_rows === 0) {
            http_response_code(500);
            echo json_encode(["error" => "Fees not found"]);
            return;
        }
        $feeRow = $feeResult->fetch_assoc();
        $stmt->close();
        $values = [];
        foreach ($months as $idx => $month) {
            $monthNo = $idx + 1;
            $monthLower = strtolower($month);
            $feeAmount = isset($feeRow[$monthLower]) ? (float)$feeRow[$monthLower] : 0;
            $status = in_array($monthNo, $selectedMonths) ? "Paid" : "Pending";
            $values[] = "('$rollno', '$studentname', '$classid', '$classsession', 
                         '$monthNo', '$month', '$feeAmount', '$status', '$timeRecord', '$ip')";
        }
        $sql = "INSERT INTO submitted_months 
                (rollno, studentname, classid, classsession, month_no, month_name, amount, status, timeRecord, ipAddress) 
                VALUES " . implode(',', $values);
        if ($conn->query($sql) === TRUE) {
            echo json_encode(["status" => true, "message" => "✅ First submission done", "total" => $total]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Database insert error: " . $conn->error]);
        }
    } else {
        // Update existing
        $monthList = implode(',', $selectedMonths);
        $updateSql = "UPDATE submitted_months 
                     SET status = 'Paid', timeRecord = ?, ipAddress = ? 
                     WHERE rollno = ? AND studentname = ? AND classid = ? AND classsession = ? 
                     AND month_no IN ($monthList)";
        $stmt = $conn->prepare($updateSql);
        $stmt->bind_param("ssssss", $timeRecord, $ip, $rollno, $studentname, $classid, $classsession);
        if ($stmt->execute()) {
            echo json_encode(["status" => true, "message" => "✅ Fees updated successfully", "total" => $total]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Database update error: " . $stmt->error]);
        }
        $stmt->close();
    }
}
function handleFeesStructure($conn, $data) {
    // ✅ Required fields
    $required = ['classid', 'classsession', 'timeRecord'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required field: $field"]);
            return;
        }
    }
    // ✅ Ensure all months exist in the data (use empty string if missing)
    $months = [
        'january','february','march','april','may','june',
        'july','august','september','october','november','december'
    ];
    foreach ($months as $m) {
        if (!isset($data[$m])) $data[$m] = "";
    }
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];
    $sql = "INSERT INTO fees 
        (class, classsession, january, february, march, april, may, june, 
         july, august, september, october, november, december, timeRecord, ipAddress) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => "Prepare failed: " . $conn->error]);
        return;
    }
    // ✅ Bind all as strings
    $stmt->bind_param(
        "ssssssssssssssss",
        $data['classid'],
        $data['classsession'],
        $data['january'], $data['february'], $data['march'], $data['april'],
        $data['may'], $data['june'], $data['july'], $data['august'],
        $data['september'], $data['october'], $data['november'], $data['december'],
        $data['timeRecord'],
        $ip
    );
    if ($stmt->execute()) {
        echo json_encode([
            "status" => "yes",
            "message" => "Fees Structure registered successfully",
            "id" => $stmt->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "status" => "False",
            "message" => "Execute failed: " . $stmt->error
        ]);
    }
    $stmt->close();
}
function handleViewStructure($conn, $data) {
    if (!isset($data['classid']) || !isset($data['classsession'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields"]);
        return;
    }
    $sql = "SELECT * FROM fees WHERE class = ? AND classsession = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $data['classid'], $data['classsession']);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        echo json_encode(["status" => "yes", "result" => $rows]);
    } else {
        echo json_encode(["status" => "no", "result" => []]);
    }
    $stmt->close();
}
function handleAlreadySubmitted($conn, $data) {
    $required = ['rollno', 'studentname', 'classid', 'classsession'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required field: $field"]);
            return;
        }
    }
    $sql = "SELECT month_no, month_name, amount, status 
            FROM submitted_months 
            WHERE rollno = ? AND studentname = ? AND classid = ? AND classsession = ? 
            ORDER BY month_no ASC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $data['rollno'], $data['studentname'], $data['classid'], $data['classsession']);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        echo json_encode(["status" => "empty", "result" => []]);
    } else {
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        echo json_encode(["status" => "yes", "result" => $rows]);
    }
    $stmt->close();
}
function handleFetchStudents($conn, $data) {
    if (!isset($data['classid']) || !isset($data['classsession'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields"]);
        return;
    }
    $sql = "SELECT * FROM students WHERE class = ? AND classsession = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ss", $data['classid'], $data['classsession']);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        echo json_encode(["status" => "no", "message" => "⚠️ No Registered Student Found!"]);
    } else {
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        echo json_encode(["status" => "yes", "result" => $rows]);
    }
    $stmt->close();
}
function handleFeeMonthStatus($conn, $data) {
    $required = ['classid', 'classsession', 'month_name'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required field: $field"]);
            return;
        }
    }
    // Get students
    $studentSql = "SELECT rollno, studentname FROM students WHERE class = ? AND classsession = ?";
    $stmt = $conn->prepare($studentSql);
    $stmt->bind_param("ss", $data['classid'], $data['classsession']);
    $stmt->execute();
    $students = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    if (empty($students)) {
        echo json_encode(["status" => "no", "message" => "No students found for this class/session"]);
        return;
    }
    // Get month data
    $monthSql = "SELECT rollno, studentname, month_name, status, timeRecord 
                 FROM submitted_months 
                 WHERE classid = ? AND classsession = ? AND month_name = ?";
    $stmt = $conn->prepare($monthSql);
    $stmt->bind_param("sss", $data['classid'], $data['classsession'], $data['month_name']);
    $stmt->execute();
    $months = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    $result = [];
    foreach ($students as $stu) {
        $submitted = null;
        foreach ($months as $m) {
            if ($m['rollno'] == $stu['rollno']) {
                $submitted = $m;
                break;
            }
        }
        if ($submitted) {
            $result[] = [
                'rollno' => $stu['rollno'],
                'studentname' => $stu['studentname'],
                'month_name' => $submitted['month_name'],
                'status' => $submitted['status'],
                'timeRecord' => $submitted['timeRecord']
            ];
        } else {
            $result[] = [
                'rollno' => $stu['rollno'],
                'studentname' => $stu['studentname'],
                'month_name' => $data['month_name'],
                'status' => "Pending",
                'timeRecord' => "⚠️ Not Available"
            ];
        }
    }
    echo json_encode(["status" => "yes", "result" => $result]);
}
function handleFeeStatusFetch($conn, $data) {
    $required = ['rollno', 'studentname', 'classid', 'classsession'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required field: $field"]);
            return;
        }
    }
    $sql = "SELECT * FROM submitted_months WHERE rollno = ? AND studentname = ? AND classid = ? AND classsession = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $data['rollno'], $data['studentname'], $data['classid'], $data['classsession']);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows === 0) {
        echo json_encode(["status" => "no", "message" => "⚠️ No fee records found!"]);
    } else {
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        echo json_encode(["status" => "yes", "result" => $rows]);
    }
    $stmt->close();
}
function handleFetchStudent($conn, $data) {
    if (!isset($data['rollno']) || !isset($data['classid']) || !isset($data['classsession'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required fields"]);
        return;
    }
    $sql = "SELECT studentname FROM students WHERE rollno = ? AND class = ? AND classsession = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $data['rollno'], $data['classid'], $data['classsession']);
    $stmt->execute();
    $result = $stmt->get_result();
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode(["status" => "yes", "result" => $rows]);
    $stmt->close();
}
function handleStudentRegFetch($conn, $data) {
    if (!isset($data['classsession'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing required field: classsession"]);
        return;
    }
    $sql = "SELECT * FROM classes WHERE classsession = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $data['classsession']);
    $stmt->execute();
    $result = $stmt->get_result();
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode(["status" => "yes", "result" => $rows]);
    $stmt->close();
}
function handleRegBulk($conn, $data) {
    if (!isset($data['students']) || !is_array($data['students'])) {
        http_response_code(400);
        echo json_encode(["error" => "Missing or invalid students data"]);
        return;
    }
    $conn->autocommit(FALSE);
    $success = true;
    foreach ($data['students'] as $stu) {
        $now = new DateTime();
        $time = $now->format('H:i:s');
        $date = $now->format('Y-m-d');
        $milliseconds = $now->format('v');
        $timeStamp = "Date: $date, Time: $time.$milliseconds";
        $ipAddr = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $sql = "INSERT INTO students (rollno, studentname, motherName, fatherName, class, classsession, address, phone, timeRecord, ipAddress) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssssssss", 
            $stu['rollno'], $stu['studentname'], $stu['mothername'], $stu['fathername'],
            $stu['class'], $stu['classsession'], $stu['address'], $stu['phone'],
            $timeStamp, $ipAddr
        );
        if (!$stmt->execute()) {
            $success = false;
            break;
        }
        $stmt->close();
    }
    if ($success) {
        $conn->commit();
        echo json_encode(["status" => true, "message" => "✅ Bulk Upload Success"]);
    } else {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["status" => false, "error" => "Bulk upload failed"]);
    }
    $conn->autocommit(TRUE);
}
function handleStudentRegRegister($conn, $data) {
    $required = ['classid', 'classsession', 'timeRecord'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required field: $field"]);
            return;
        }
    }
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];
    $sql = "INSERT INTO classes (class, classsession, timeRecord, ipAddress) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $data['classid'], $data['classsession'], $data['timeRecord'], $ip);
    if ($stmt->execute()) {
        echo json_encode([
            "status" => "yes",
            "message" => "Class registered successfully",
            "id" => $stmt->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "False", "message" => "Database Error: " . $stmt->error]);
    }
    $stmt->close();
}
function handleCheck($conn, $data) {
    $required = ['rollno', 'studentname', 'classid', 'classsession'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required field: $field"]);
            return;
        }
    }
    // Check student
    $studentSql = "SELECT * FROM students WHERE rollno = ? AND studentname = ?";
    $stmt = $conn->prepare($studentSql);
    $stmt->bind_param("ss", $data['rollno'], $data['studentname']);
    $stmt->execute();
    $studentResult = $stmt->get_result();
    $stmt->close();
    if ($studentResult->num_rows === 0) {
        echo json_encode([
            "status" => false,
            "message" => "Invalid student details",
            "result" => []
        ]);
        return;
    }
    // Check fees
    $feesSql = "SELECT * FROM fees WHERE class = ? AND classsession = ?";
    $stmt = $conn->prepare($feesSql);
    $stmt->bind_param("ss", $data['classid'], $data['classsession']);
    $stmt->execute();
    $feesResult = $stmt->get_result();
    $stmt->close();
    if ($feesResult->num_rows === 0) {
        echo json_encode([
            "status" => false,
            "message" => "Invalid class or session",
            "result" => []
        ]);
        return;
    }
    $rows = [];
    while ($row = $feesResult->fetch_assoc()) {
        $rows[] = $row;
    }
    echo json_encode([
        "status" => true,
        "message" => "Fees Fetched Successfully",
        "result" => $rows
    ]);
}
function handleReport($conn, $data) {
    $studentname = $data['studentname'] ?? null;
    $rollno = $data['rollno'] ?? null;
    $classid = $data['classid'] ?? null;
    $session = $data['session'] ?? null;
    if (!$studentname && !$rollno) {
        if (!$classid || !$session) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required fields"]);
            return;
        }
        $sql = "SELECT * FROM submitted WHERE classid = ? AND classsession = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $classid, $session);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $sql = "SELECT * FROM submitted WHERE studentname = ? AND rollno = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ss", $studentname, $rollno);
        $stmt->execute();
        $result = $stmt->get_result();
    }
    if ($result->num_rows === 0) {
        echo json_encode(["status" => "no", "message" => "No students found"]);
    } else {
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        echo json_encode(["status" => "yes", "result" => $rows]);
    }
    $stmt->close();
}
function handleReg($conn, $data) {
    $required = ['rollno', 'studentname', 'mothername', 'fathername', 'classid', 'classsession', 'address', 'phone', 'timeRecord'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(["error" => "Missing required field: $field"]);
            return;
        }
    }
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];
    $sql = "INSERT INTO students (rollno, studentname, mothername, fathername, class, classsession, address, phone, timeRecord, ipAddress) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssssssssss", 
        $data['rollno'], $data['studentname'], $data['mothername'], $data['fathername'],
        $data['classid'], $data['classsession'], $data['address'], $data['phone'],
        $data['timeRecord'], $ip
    );
    if ($stmt->execute()) {
        echo json_encode([
            "status" => "yes",
            "message" => "User registered successfully",
            "id" => $stmt->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "False", "message" => "Database Error: " . $stmt->error]);
    }
    $stmt->close();
}
function handleAdmin($conn, $data, $secret_key) {
    if (!isset($data['logkey'])) {
        http_response_code(400);
        echo json_encode(["status" => false, "message" => "Missing logkey"]);
        return;
    }
    $logkey = $data['logkey'];
    $stmt = $conn->prepare("SELECT * FROM adminlog WHERE logkey = ?");
    $stmt->bind_param("s", $logkey);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $payload = [
            "iss" => "http://localhost",
            "aud" => "http://localhost",
            "iat" => time(),
            "exp" => time() + (60 * 60), // 1 hour expiry
            "logkey" => $logkey
        ];

        $jwt = JWT::encode($payload, $secret_key, 'HS256');

        echo json_encode([
            "status" => true,
            "message" => "Admin verified",
            "token" => $jwt
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["status" => false, "message" => "Invalid logkey"]);
    }
}
$conn->close();
?>