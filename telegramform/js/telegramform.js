(function ($) {
  // Функция для сохранения данных пользователя
  function saveUserData(formData) {
    if (formData.get('name')) {
      localStorage.setItem('user_name', formData.get('name'));
    }
    if (formData.get('phone')) {
      localStorage.setItem('user_phone', formData.get('phone'));
    }
    if (formData.get('email')) {
      localStorage.setItem('user_email', formData.get('email'));
    }
    // Сохраняем название организации
    if (formData.get('organization')) {
      localStorage.setItem('user_organization', formData.get('organization'));
    }
  }
  
  // Функция для добавления данных пользователя в FormData
  function addUserDataToFormData(fd) {
    const userName = localStorage.getItem('user_name');
    const userPhone = localStorage.getItem('user_phone');
    const userEmail = localStorage.getItem('user_email');
    const userOrganization = localStorage.getItem('user_organization');
    
    if (userName) {
      fd.append('user_name', userName);
    }
    if (userPhone) {
      fd.append('user_phone', userPhone);
    }
    if (userEmail) {
      fd.append('user_email', userEmail);
    }
    if (userOrganization) {
      fd.append('user_organization', userOrganization);
    }
    
    return fd;
  }
  
  // Функция для отображения информации о пользователе
  function displayUserInfo() {
    const userName = localStorage.getItem('user_name');
    const userPhone = localStorage.getItem('user_phone');
    const userOrganization = localStorage.getItem('user_organization');
    
    // Удаляем старый блок, если есть
    $('.user-info').remove();
    
    if (userName || userPhone || userOrganization) {
      let userInfoHtml = '<div class="user-info" style="background: #2a2f3d; padding: 2px; margin-bottom: 20px; border-radius: 5px;">';
      userInfoHtml += '<p style="margin: 0; font-size: 14px;">Текущий пользователь:</p>';
      if (userName) {
        userInfoHtml += '<p style="margin: 5px 0 0 0; font-weight: bold;">' + userName + '</p>';
      }
      if (userOrganization) {
        userInfoHtml += '<p style="margin: 0; font-size: 14px;">Организация: ' + userOrganization + '</p>';
      }
      if (userPhone) {
        userInfoHtml += '<p style="margin: 0; font-size: 14px;">' + userPhone + '</p>';
      }
      userInfoHtml += '<button id="clear-user-data" style="margin-top: 10px; background: #ff6b6b; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Сменить пользователя</button>';
      userInfoHtml += '</div>';
      
      // Добавляем блок информации на страницу
      $('.container').prepend(userInfoHtml);
      
      // Обработчик для кнопки очистки данных
      $('#clear-user-data').click(function() {
        localStorage.removeItem('user_name');
        localStorage.removeItem('user_phone');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_organization');
        location.reload();
      });
    }
  }

  // Обработчик для первой формы (обязательной)
  $("#form-contact").submit(function (event) {
    event.preventDefault();

    // Сообщения формы
    let successSendText = "Сообщение успешно отправлено";
    let errorSendText = "Сообщение не отправлено. Попробуйте еще раз!";
    let requiredFieldsText = "Заполните обязательные поля";

    let message = $(this).find(".brief__form__message");
    let form = $("#" + $(this).attr("id"))[0];
    let fd = new FormData(form);
    
    // Проверяем обязательные поля для первой формы
    if (!fd.get('name') || !fd.get('phone') || !fd.get('email')) {
      message.text(requiredFieldsText).css("color", "#d42121");
      setTimeout(() => {
        message.text("");
      }, 3000);
      return;
    }
    
    // Добавляем тему формы
    let formName = $(this).find('h2').text() || 'Форма без названия';
    fd.append('theme', formName);

    $.ajax({
      url: "/telegramform/php/send-message-to-telegram.php",
      type: "POST",
      data: fd,
      processData: false,
      contentType: false,
      beforeSend: () => {
        $(".preloader").addClass("preloader_active");
      },
      success: function success(res) {
        $(".preloader").removeClass("preloader_active");

        let respond = $.parseJSON(res);

        if (respond === "SUCCESS") {
          // Сохраняем данные пользователя
          saveUserData(fd);
          // Обновляем отображение информации о пользователе
          displayUserInfo();
          message.text(successSendText).css("color", "#21d4bb");
          setTimeout(() => {
            message.text("");
            form.reset();
          }, 4000);
        } else {
          message.text(errorSendText).css("color", "#d42121");
          setTimeout(() => {
            message.text("");
          }, 4000);
        }
      }
    });
  });
  
  // Обработчики для остальных форм
  $(".info__form, .netproject__form, .target__form, .design__form, .support__form, .materials__form, .budget__form").submit(function (event) {
    event.preventDefault();

    // Сообщения формы
    let successSendText = "Сообщение успешно отправлено";
    let errorSendText = "Сообщение не отправлено. Попробуйте еще раз!";
    let emptyFormText = "Заполните хотя бы одно поле";

    let message = $(this).find(".brief__form__message");
    let form = $("#" + $(this).attr("id"))[0];
    let fd = new FormData(form);
    
    // Добавляем тему формы
    let formName = $(this).find('h2').text() || 'Форма без названия';
    fd.append('theme', formName);
    
    // Добавляем данные пользователя в FormData
    fd = addUserDataToFormData(fd);

    // Проверяем, есть ли хотя бы одно заполненное поле
    let hasData = false;
    $(this).find('input, textarea, select').each(function() {
        if ($(this).val().trim() !== '' && !$(this).is('[type="hidden"]')) {
            hasData = true;
            return false; // break the loop
        }
    });

    // Также проверяем, есть ли данные пользователя
    const userName = localStorage.getItem('user_name');
    const userPhone = localStorage.getItem('user_phone');
    const hasUserData = userName || userPhone;

    if (!hasData && !hasUserData) {
        message.text(emptyFormText).css("color", "#d42121");
        setTimeout(() => {
            message.text("");
        }, 3000);
        return;
    }

    $.ajax({
      url: "/telegramform/php/send-message-to-telegram.php",
      type: "POST",
      data: fd,
      processData: false,
      contentType: false,
      beforeSend: () => {
        $(".preloader").addClass("preloader_active");
      },
      success: function success(res) {
        $(".preloader").removeClass("preloader_active");

        let respond = $.parseJSON(res);

        if (respond === "SUCCESS") {
          message.text(successSendText).css("color", "#21d4bb");
          setTimeout(() => {
            message.text("");
            form.reset();
          }, 4000);
        } else if (respond === "NOTVALID") {
          message.text(emptyFormText).css("color", "#d42121");
          setTimeout(() => {
            message.text("");
          }, 3000);
        } else {
          message.text(errorSendText).css("color", "#d42121");
          setTimeout(() => {
            message.text("");
          }, 4000);
        }
      }
    });
  });

  // Вызываем при загрузке страницы
  $(document).ready(function() {
    displayUserInfo();
  });
})(jQuery);