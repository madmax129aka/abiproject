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
import java.util.List;
import java.util.Map;

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
                .fullName("Admin User")
                .email("admin@skillswap.com")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .dob(LocalDate.of(1990, 1, 1))
                .gender("Male")
                .mobile("9999999999")
                .preferredLanguage("en")
                .location("Platform")
                .role("admin")
                .reputationScore(5.0)
                .skillSetupComplete(true)
                .build();
        userRepository.save(admin);
        System.out.println("Admin: admin@skillswap.com / Admin@123");
    }

    private void seedDemoUsers() {
        List<Map<String, Object>> demos = List.of(
            Map.of("name","Alex Johnson","email","alex@demo.com","dob","1998-05-15","gender","Male","mobile","9876543210","lang","en","loc","Chennai","rep",4.5,"teach",List.of(Map.of("n","JavaScript","l","Expert"),Map.of("n","React","l","Expert")),"learn",List.of("Python","Guitar")),
            Map.of("name","Priya Sharma","email","priya@demo.com","dob","1999-08-22","gender","Female","mobile","9876543211","lang","hi","loc","Mumbai","rep",4.2,"teach",List.of(Map.of("n","Python","l","Expert"),Map.of("n","SQL","l","Intermediate")),"learn",List.of("JavaScript","Yoga")),
            Map.of("name","Karthik Rajan","email","karthik@demo.com","dob","1997-03-10","gender","Male","mobile","9876543212","lang","ta","loc","Coimbatore","rep",4.8,"teach",List.of(Map.of("n","Guitar","l","Expert"),Map.of("n","Music Production","l","Intermediate")),"learn",List.of("React","French")),
            Map.of("name","Deepa Lakshmi","email","deepa@demo.com","dob","2000-11-05","gender","Female","mobile","9876543213","lang","en","loc","Bangalore","rep",3.8,"teach",List.of(Map.of("n","Yoga","l","Expert"),Map.of("n","Meditation","l","Expert")),"learn",List.of("Python","Photography")),
            Map.of("name","Rahul Verma","email","rahul@demo.com","dob","1996-07-18","gender","Male","mobile","9876543214","lang","en","loc","Delhi","rep",4.0,"teach",List.of(Map.of("n","Photography","l","Expert"),Map.of("n","Video Editing","l","Intermediate")),"learn",List.of("Guitar","JavaScript"))
        );

        for (Map<String, Object> d : demos) {
            User user = User.builder()
                    .fullName((String) d.get("name"))
                    .email((String) d.get("email"))
                    .passwordHash(passwordEncoder.encode("Demo@123"))
                    .dob(LocalDate.parse((String) d.get("dob")))
                    .gender((String) d.get("gender"))
                    .mobile((String) d.get("mobile"))
                    .preferredLanguage((String) d.get("lang"))
                    .location((String) d.get("loc"))
                    .reputationScore((double) d.get("rep"))
                    .skillSetupComplete(true)
                    .build();
            user = userRepository.save(user);

            List<Map<String, String>> teachSkills = (List<Map<String, String>>) d.get("teach");
            for (Map<String, String> ts : teachSkills) {
                Skill skill = skillRepository.findByName(ts.get("n")).orElse(null);
                userSkillRepository.save(UserSkill.builder()
                        .userId(user.getId())
                        .skillId(skill != null ? skill.getId() : null)
                        .skillName(ts.get("n"))
                        .type("teach")
                        .experienceLevel(ts.get("l"))
                        .isVerified(true)
                        .validationScore(85)
                        .build());
            }

            List<String> learnSkills = (List<String>) d.get("learn");
            for (String ls : learnSkills) {
                Skill skill = skillRepository.findByName(ls).orElse(null);
                userSkillRepository.save(UserSkill.builder()
                        .userId(user.getId())
                        .skillId(skill != null ? skill.getId() : null)
                        .skillName(ls)
                        .type("learn")
                        .experienceLevel("Beginner")
                        .build());
            }
            System.out.println("Demo: " + d.get("email") + " / Demo@123");
        }
    }
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
