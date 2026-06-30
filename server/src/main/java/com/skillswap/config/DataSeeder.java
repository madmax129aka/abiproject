package com.skillswap.config;

import com.skillswap.entity.Skill;
import com.skillswap.entity.User;
import com.skillswap.entity.UserSkill;
import com.skillswap.repository.SkillRepository;
import com.skillswap.repository.UserRepository;
import com.skillswap.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final UserSkillRepository userSkillRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (skillRepository.count() > 0) {
            System.out.println("Database already seeded. Skipping...");
            return;
        }
        System.out.println("Seeding database...");
        seedSkills();
        seedAdmin();
        seedDemoUsers();
        System.out.println("Database seeding complete!");
    }

    private void seedSkills() {
        String[][] skills = {
            {"JavaScript","Programming"},{"Python","Programming"},{"Java","Programming"},
            {"C++","Programming"},{"React","Programming"},{"Node.js","Programming"},
            {"SQL","Programming"},{"TypeScript","Programming"},{"Go","Programming"},{"Rust","Programming"},
            {"Figma","Design"},{"Photoshop","Design"},{"Illustrator","Design"},
            {"UI/UX Design","Design"},{"Canva","Design"},{"3D Modeling","Design"},
            {"Guitar","Music"},{"Piano","Music"},{"Vocals","Music"},
            {"Music Production","Music"},{"Violin","Music"},{"Drums","Music"},
            {"French","Languages"},{"Spanish","Languages"},{"Japanese","Languages"},
            {"German","Languages"},{"Mandarin","Languages"},{"Tamil","Languages"},{"Hindi","Languages"},
            {"Stock Trading","Finance"},{"Personal Finance","Finance"},{"Accounting","Finance"},
            {"Excel","Finance"},{"Crypto Basics","Finance"},
            {"Yoga","Fitness"},{"Nutrition Planning","Fitness"},
            {"Personal Training","Fitness"},{"Meditation","Fitness"},
            {"Photography","Creative"},{"Video Editing","Creative"},
            {"Creative Writing","Creative"},{"Drawing","Creative"},{"Watercolor","Creative"},
            {"Public Speaking","Business"},{"Marketing","Business"},
            {"SEO","Business"},{"Copywriting","Business"},{"Product Management","Business"},
            {"Cooking","Life Skills"},{"Driving","Life Skills"},{"First Aid","Life Skills"},
            {"Time Management","Life Skills"},{"Journaling","Life Skills"},
            {"Math Tutoring","Academic"},{"Physics","Academic"},
            {"Chemistry","Academic"},{"History","Academic"},{"Essay Writing","Academic"}
        };
        for (String[] s : skills) {
            skillRepository.save(Skill.builder().name(s[0]).category(s[1]).build());
        }
        System.out.println("Inserted " + skills.length + " skills");
    }

    private void seedAdmin() {
        User admin = User.builder()
                .fullName("Admin User").email("admin@skillswap.com")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .dob(LocalDate.of(1990, 1, 1)).gender("Male").mobile("9999999999")
                .preferredLanguage("en").location("Platform").role("admin")
                .reputationScore(5.0).skillSetupComplete(true).build();
        userRepository.save(admin);
        System.out.println("Admin: admin@skillswap.com / Admin@123");
    }

    @SuppressWarnings("unchecked")
    private void seedDemoUsers() {
        Object[][] demos = {
            {"Alex Johnson","alex@demo.com","1998-05-15","Male","9876543210","en","Chennai",4.5, new String[][]{{"JavaScript","Expert"},{"React","Expert"}}, new String[]{"Python","Guitar"}},
            {"Priya Sharma","priya@demo.com","1999-08-22","Female","9876543211","hi","Mumbai",4.2, new String[][]{{"Python","Expert"},{"SQL","Intermediate"}}, new String[]{"JavaScript","Yoga"}},
            {"Karthik Rajan","karthik@demo.com","1997-03-10","Male","9876543212","ta","Coimbatore",4.8, new String[][]{{"Guitar","Expert"},{"Music Production","Intermediate"}}, new String[]{"React","French"}},
            {"Deepa Lakshmi","deepa@demo.com","2000-11-05","Female","9876543213","en","Bangalore",3.8, new String[][]{{"Yoga","Expert"},{"Meditation","Expert"}}, new String[]{"Python","Photography"}},
            {"Rahul Verma","rahul@demo.com","1996-07-18","Male","9876543214","en","Delhi",4.0, new String[][]{{"Photography","Expert"},{"Video Editing","Intermediate"}}, new String[]{"Guitar","JavaScript"}}
        };

        for (Object[] d : demos) {
            User user = User.builder()
                    .fullName((String)d[0]).email((String)d[1])
                    .passwordHash(passwordEncoder.encode("Demo@123"))
                    .dob(LocalDate.parse((String)d[2])).gender((String)d[3]).mobile((String)d[4])
                    .preferredLanguage((String)d[5]).location((String)d[6])
                    .reputationScore((double)d[7]).skillSetupComplete(true).build();
            user = userRepository.save(user);

            String[][] teachSkills = (String[][]) d[8];
            for (String[] ts : teachSkills) {
                Skill skill = skillRepository.findByName(ts[0]).orElse(null);
                userSkillRepository.save(UserSkill.builder()
                        .userId(user.getId()).skillId(skill != null ? skill.getId() : null)
                        .skillName(ts[0]).type("teach").experienceLevel(ts[1])
                        .isVerified(true).validationScore(85).build());
            }

            String[] learnSkills = (String[]) d[9];
            for (String ls : learnSkills) {
                Skill skill = skillRepository.findByName(ls).orElse(null);
                userSkillRepository.save(UserSkill.builder()
                        .userId(user.getId()).skillId(skill != null ? skill.getId() : null)
                        .skillName(ls).type("learn").experienceLevel("Beginner").build());
            }
            System.out.println("Demo: " + d[1] + " / Demo@123");
        }
    }
}
