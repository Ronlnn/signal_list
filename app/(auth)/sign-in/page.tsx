'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import {signInWithEmail} from "@/lib/actions/auth.actions";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {t} from "@/lib/i18n";

const SignIn = () => {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: SignInFormData) => {
        try {
            const result = await signInWithEmail(data);
            if(result.success) router.push('/');
        } catch (e) {
            console.error(e);
            toast.error(t('auth.signInFailed'), {
                description: e instanceof Error ? e.message : t('auth.signInFailedDescription')
            })
        }
    }

    return (
        <>
            <h1 className="form-title">{t('auth.signInTitle')}</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                    placeholder={t('auth.passwordPlaceholder')}
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: t('auth.passwordRequired'), minLength: 8 }}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
                </Button>

                <FooterLink text={t('auth.noAccount')} linkText={t('auth.createAccount')} href="/sign-up" />
            </form>
        </>
    );
};
export default SignIn;
