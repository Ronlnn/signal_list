'use client';

import {useForm} from "react-hook-form";
import {Button} from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import {INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS} from "@/lib/constants";
import {CountrySelectField} from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";
import {signUpWithEmail} from "@/lib/actions/auth.actions";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {t} from "@/lib/i18n";

const SignUp = () => {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            country: 'US',
            investmentGoals: 'Growth',
            riskTolerance: 'Medium',
            preferredIndustry: 'Technology'
        },
        mode: 'onBlur'
    }, );

    const onSubmit = async (data: SignUpFormData) => {
        try {
            const result = await signUpWithEmail(data);
            if(result.success) router.push('/');
        } catch (e) {
            console.error(e);
            toast.error(t('auth.signUpFailed'), {
                description: e instanceof Error ? e.message : t('auth.signUpFailedDescription')
            })
        }
    }

    return (
        <>
            <h1 className="form-title">{t('auth.signUpTitle')}</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="fullName"
                    label={t('auth.fullName')}
                    placeholder={t('auth.fullNamePlaceholder')}
                    register={register}
                    error={errors.fullName}
                    validation={{
                        required: t('auth.fullNameRequired'),
                        minLength: { value: 2, message: t('auth.fullNameMinLength') },
                    }}
                />

                <InputField
                    name="email"
                    label={t('auth.email')}
                    placeholder={t('auth.emailPlaceholder')}
                    register={register}
                    error={errors.email}
                    validation={{
                        required: t('auth.emailRequired'),
                        pattern: { value: /^\w+@\w+\.\w+$/, message: t('auth.emailInvalid') },
                    }}
                />

                <InputField
                    name="password"
                    label={t('auth.password')}
                    placeholder={t('auth.strongPasswordPlaceholder')}
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: t('auth.passwordRequired'), minLength: 8 }}
                />

                <CountrySelectField
                    name="country"
                    label={t('auth.country')}
                    control={control}
                    error={errors.country}
                    required
                />

                <SelectField
                    name="investmentGoals"
                    label={t('auth.investmentGoals')}
                    placeholder={t('auth.investmentGoalsPlaceholder')}
                    options={INVESTMENT_GOALS}
                    control={control}
                    error={errors.investmentGoals}
                    required
                />

                <SelectField
                    name="riskTolerance"
                    label={t('auth.riskTolerance')}
                    placeholder={t('auth.riskTolerancePlaceholder')}
                    options={RISK_TOLERANCE_OPTIONS}
                    control={control}
                    error={errors.riskTolerance}
                    required
                />

                <SelectField
                    name="preferredIndustry"
                    label={t('auth.preferredIndustry')}
                    placeholder={t('auth.preferredIndustryPlaceholder')}
                    options={PREFERRED_INDUSTRIES}
                    control={control}
                    error={errors.preferredIndustry}
                    required
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? t('auth.creatingAccount') : t('auth.signUp')}
                </Button>

                <FooterLink text={t('auth.hasAccount')} linkText={t('auth.signInLink')} href="/sign-in" />
            </form>
        </>
    )
}
export default SignUp;
