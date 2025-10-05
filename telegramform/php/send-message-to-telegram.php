<?php

// Токен
const TOKEN = '7569456083:AAFaSeXSc4E1W2mtoC1OzalQlPq7MPKFnRo';

// ID чата
const CHATID = '789581935';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Создаем текстовый файл с данными формы
    $formData = "";
    
    // Добавляем информацию о форме
    if (isset($_POST['theme']) && !empty($_POST['theme'])) {
        $formData .= "=== " . strip_tags(trim($_POST['theme'])) . " ===\n\n";
    }
    
    // Получаем название компании для имени файла
    $companyName = "Неизвестная компания";
    if (isset($_POST['organization']) && !empty($_POST['organization'])) {
        $companyName = strip_tags(trim($_POST['organization']));
    } elseif (isset($_POST['user_organization']) && !empty($_POST['user_organization'])) {
        $companyName = strip_tags(trim($_POST['user_organization']));
    }
    
    // Очищаем название компании от недопустимых символов для имени файла
    $cleanCompanyName = preg_replace('/[^\w\s-]/', '', $companyName);
    $cleanCompanyName = preg_replace('/[\s]+/', '_', $cleanCompanyName);
    $cleanCompanyName = substr($cleanCompanyName, 0, 50); // Ограничиваем длину
    
    // Создаем имя файла в формате: Дата_Название компании
    $currentDate = date('Y-m-d');
    $filename = $currentDate . '_' . $cleanCompanyName . '.txt';
    
    // Добавляем идентификационные данные пользователя, если они есть
    $userIdentifier = "";
    if (isset($_POST['user_name']) && !empty($_POST['user_name'])) {
        $userIdentifier .= "Пользователь: " . strip_tags(trim($_POST['user_name'])) . "\n";
    }
    if (isset($_POST['user_phone']) && !empty($_POST['user_phone'])) {
        $userIdentifier .= "Телефон: " . strip_tags(trim($_POST['user_phone'])) . "\n";
    }
    if (isset($_POST['user_email']) && !empty($_POST['user_email'])) {
        $userIdentifier .= "Email: " . strip_tags(trim($_POST['user_email'])) . "\n";
    }
    
    // Также проверяем обычные поля (для первой формы)
    if (empty($userIdentifier)) {
        if (isset($_POST['name']) && !empty($_POST['name'])) {
            $userIdentifier .= "Пользователь: " . strip_tags(trim($_POST['name'])) . "\n";
        }
        if (isset($_POST['phone']) && !empty($_POST['phone'])) {
            $userIdentifier .= "Телефон: " . strip_tags(trim($_POST['phone'])) . "\n";
        }
        if (isset($_POST['email']) && !empty($_POST['email'])) {
            $userIdentifier .= "Email: " . strip_tags(trim($_POST['email'])) . "\n";
        }
    }
    
    if (!empty($userIdentifier)) {
        $formData .= $userIdentifier . "\n";
    }
    
    // Добавляем все поля формы в текстовый файл (кроме служебных)
    $hasData = false;
    foreach ($_POST as $key => $value) {
        // Пропускаем служебные поля
        if (in_array($key, ['theme', 'user_name', 'user_phone', 'user_email', 'user_organization'])) continue;
        
        // Пропускаем пустые значения
        if (empty(trim($value))) continue;
        
        $fieldName = ucfirst(str_replace('_', ' ', $key));
        $formData .= $fieldName . ": " . strip_tags(trim($value)) . "\n";
        $hasData = true;
    }
    
    // Если нет данных (все поля пустые), не отправляем
    if (!$hasData && empty($userIdentifier)) {
        echo json_encode('NOTVALID');
        exit;
    }
    
    // Создаем временный файл с нужным именем
    $tempDir = sys_get_temp_dir();
    $tempFile = tempnam($tempDir, 'form_');
    
    // Переименовываем временный файл в нужное имя
    $finalFilePath = $tempDir . '/' . $filename;
    rename($tempFile, $finalFilePath);
    file_put_contents($finalFilePath, $formData);
    
    // Отправляем файл в Telegram
    $urlFile = "https://api.telegram.org/bot" . TOKEN . "/sendDocument";
    
    $postContent = [
        'chat_id' => CHATID,
        'caption' => 'Новая заявка с формы: ' . (isset($_POST['theme']) ? $_POST['theme'] : 'Без названия'),
        'document' => new CURLFile($finalFilePath, 'text/plain', $filename)
    ];
    
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_HTTPHEADER, ["Content-Type:multipart/form-data"]);
    curl_setopt($curl, CURLOPT_URL, $urlFile);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_POSTFIELDS, $postContent);
    $fileSendStatus = curl_exec($curl);
    curl_close($curl);
    
    // Удаляем временный файл
    unlink($finalFilePath);
    
    if (isset(json_decode($fileSendStatus)->{'ok'}) && json_decode($fileSendStatus)->{'ok'}) {
        echo json_encode('SUCCESS');
    } else {
        echo json_encode('ERROR');
    }
} else {
    header("Location: /");
}