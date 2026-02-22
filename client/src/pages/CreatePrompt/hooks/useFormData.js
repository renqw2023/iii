import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

/**
 * 表单数据管理Hook
 * 统一管理CreatePrompt组件的所有表单数据和验证
 */
const useFormData = () => {
  const { t } = useTranslation();
  
  const { register, handleSubmit, watch, reset, formState } = useForm({
    defaultValues: {
      category: 'other',
      difficulty: 'beginner'
    }
  });
  
  const { errors } = formState;

  // 表单验证规则
  const validationRules = {
    title: {
      required: t('createPrompt.basicInfo.titleRequired')
    },
    prompt: {
      required: t('createPrompt.basicInfo.promptRequired'),
      minLength: {
        value: 10,
        message: t('createPrompt.basicInfo.promptMinLength')
      },
      maxLength: {
        value: 5000,
        message: t('createPrompt.basicInfo.promptMaxLength')
      }
    },
    description: {
      maxLength: {
        value: 2000,
        message: '描述不能超过2000个字符'
      }
    },
    expectedResult: {
      maxLength: {
        value: 1000,
        message: '预期效果描述不能超过1000个字符'
      }
    },
    tips: {
      maxLength: {
        value: 1000,
        message: '使用技巧不能超过1000个字符'
      }
    }
  };

  // 重置表单到初始状态
  const resetForm = () => {
    reset({
      category: 'other',
      difficulty: 'beginner'
    });
  };

  return {
    register,
    handleSubmit,
    watch,
    reset: resetForm,
    formState,
    errors,
    validationRules
  };
};

export default useFormData;